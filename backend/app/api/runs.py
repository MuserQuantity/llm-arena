from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import Run, Task, TaskModelAssignment
from app.schemas.schemas import RunResponse

router = APIRouter(prefix="/api/runs", tags=["runs"])


def _run_to_response(run: Run) -> RunResponse:
    """Convert a Run ORM object to RunResponse with denormalized fields."""
    assignment = run.task_assignment
    task = assignment.task if assignment else None
    model = assignment.model if assignment else None
    dimension = task.dimension if task else None

    return RunResponse(
        id=run.id,
        task_assignment_id=run.task_assignment_id,
        status=run.status,
        output=run.output,
        output_type=run.output_type,
        started_at=run.started_at,
        completed_at=run.completed_at,
        duration_ms=run.duration_ms,
        error_message=run.error_message,
        created_at=run.created_at,
        updated_at=run.updated_at,
        task_id=task.id if task else None,
        task_title=task.title if task else None,
        model_id=model.id if model else None,
        model_name=model.name if model else None,
        model_icon_key=model.icon_key if model else None,
        dimension_name=dimension.name if dimension else None,
    )


@router.get("", response_model=list[RunResponse])
async def list_runs(
    task_id: str | None = None,
    model_id: str | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Run)
        .options(
            selectinload(Run.task_assignment).selectinload(TaskModelAssignment.task).selectinload(Task.dimension),
            selectinload(Run.task_assignment).selectinload(TaskModelAssignment.model),
        )
        .order_by(Run.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if status:
        query = query.where(Run.status == status)
    if task_id:
        query = query.join(TaskModelAssignment).where(TaskModelAssignment.task_id == task_id)
    if model_id:
        if not task_id:
            query = query.join(TaskModelAssignment)
        query = query.where(TaskModelAssignment.model_id == model_id)

    result = await db.execute(query)
    runs = result.scalars().unique().all()
    return [_run_to_response(r) for r in runs]


@router.get("/{run_id}", response_model=RunResponse)
async def get_run(run_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Run)
        .where(Run.id == run_id)
        .options(
            selectinload(Run.task_assignment).selectinload(TaskModelAssignment.task).selectinload(Task.dimension),
            selectinload(Run.task_assignment).selectinload(TaskModelAssignment.model),
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return _run_to_response(run)


@router.post("", status_code=201)
async def create_runs(task_id: str, db: AsyncSession = Depends(get_db)):
    """Create runs for all model assignments of a task."""
    result = await db.execute(
        select(TaskModelAssignment).where(TaskModelAssignment.task_id == task_id)
    )
    assignments = result.scalars().all()
    if not assignments:
        raise HTTPException(status_code=400, detail="No model assignments found for this task")

    created_runs = []
    for assignment in assignments:
        run = Run(task_assignment_id=assignment.id, status="pending")
        db.add(run)
        created_runs.append(run)

    await db.flush()
    return {"created": len(created_runs), "run_ids": [r.id for r in created_runs]}


@router.post("/{run_id}/retry", response_model=RunResponse)
async def retry_run(run_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Run)
        .where(Run.id == run_id)
        .options(
            selectinload(Run.task_assignment).selectinload(TaskModelAssignment.task).selectinload(Task.dimension),
            selectinload(Run.task_assignment).selectinload(TaskModelAssignment.model),
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status not in ("failed", "done"):
        raise HTTPException(status_code=400, detail="Can only retry failed or completed runs")

    run.status = "pending"
    run.output = ""
    run.error_message = ""
    run.started_at = None
    run.completed_at = None
    run.duration_ms = None
    await db.flush()
    await db.refresh(run)
    return _run_to_response(run)


@router.post("/{run_id}/execute")
async def execute_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """Execute a single run by calling the LLM API.

    DB session is released before the LLM API call to avoid holding connections
    during long-running HTTP requests (up to 120s).
    """
    import httpx

    from app.config import settings
    from app.database import async_session
    from app.utils.url_validation import validate_api_url

    result = await db.execute(
        select(Run)
        .where(Run.id == run_id)
        .options(
            selectinload(Run.task_assignment).selectinload(TaskModelAssignment.task).selectinload(Task.dimension),
            selectinload(Run.task_assignment).selectinload(TaskModelAssignment.model),
        )
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    assignment = run.task_assignment
    task = assignment.task
    model = assignment.model

    # Use model-specific API or global API
    api_base = model.api_base or settings.llm_api_base_url
    api_key = model.api_key_encrypted or settings.llm_api_key

    # Validate URL to prevent SSRF
    await validate_api_url(api_base)

    # Extract all data we need before releasing the DB session
    model_id_str = model.model_id
    prompt = task.prompt
    expected_output_type = task.expected_output_type
    default_params = dict(model.default_params) if model.default_params else None
    override_params = dict(assignment.override_params) if assignment.override_params else None
    fixed_params = dict(model.fixed_params) if model.fixed_params else None

    # Mark as running and commit (releases DB connection)
    run.status = "running"
    run.started_at = datetime.now(timezone.utc)
    await db.flush()
    await db.commit()

    # --- DB session is now released; make the LLM API call ---
    llm_status = "done"
    llm_output = ""
    llm_error = ""
    started_at = run.started_at

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": model_id_str,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            }
            # Apply default and override params (but protect core fields)
            protected_keys = {"model", "messages"}
            if default_params:
                payload.update({k: v for k, v in default_params.items() if k not in protected_keys})
            if override_params:
                payload.update({k: v for k, v in override_params.items() if k not in protected_keys})
            if fixed_params:
                payload.update({k: v for k, v in fixed_params.items() if k not in protected_keys})

            resp = await client.post(f"{api_base}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

            llm_output = data["choices"][0]["message"]["content"]
            llm_status = "done"

    except Exception as e:
        llm_status = "failed"
        llm_error = str(e)

    # --- Acquire a new DB session to write results ---
    completed_at = datetime.now(timezone.utc)
    duration_ms = int((completed_at - started_at).total_seconds() * 1000) if started_at else None

    async with async_session() as write_session:
        try:
            result = await write_session.execute(select(Run).where(Run.id == run_id))
            run = result.scalar_one_or_none()
            if run:
                run.status = llm_status
                run.output = llm_output
                run.output_type = expected_output_type if llm_status == "done" else run.output_type
                run.error_message = llm_error
                run.completed_at = completed_at
                run.duration_ms = duration_ms
            await write_session.commit()
        except Exception:
            await write_session.rollback()
            raise

    return {"status": llm_status, "run_id": run_id}
