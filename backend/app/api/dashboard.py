from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import Dimension, LLMModel, Run, Score, Task, TaskModelAssignment
from app.schemas.schemas import LeaderboardEntry, ModelEvalSummary, ModelTaskResult

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(dimension_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Get leaderboard data with average scores per model."""
    query = (
        select(
            LLMModel.id.label("model_id"),
            LLMModel.name.label("model_name"),
            LLMModel.icon_key.label("model_icon_key"),
            LLMModel.provider.label("provider"),
            func.avg(Score.numeric_score).label("avg_score"),
            func.count(Run.id.distinct()).label("total_runs"),
            func.max(Score.numeric_score).label("top_score"),
            func.max(Run.completed_at).label("last_updated"),
        )
        .join(TaskModelAssignment, LLMModel.id == TaskModelAssignment.model_id)
        .join(Run, TaskModelAssignment.id == Run.task_assignment_id)
        .join(Score, Run.id == Score.run_id)
        .where(Run.status == "done")
        .where(Score.numeric_score.isnot(None))
        .group_by(LLMModel.id, LLMModel.name, LLMModel.icon_key, LLMModel.provider)
    )

    if dimension_id:
        query = query.join(Task, TaskModelAssignment.task_id == Task.id).where(Task.dimension_id == dimension_id)

    query = query.order_by(func.avg(Score.numeric_score).desc())

    result = await db.execute(query)
    rows = result.all()

    return [
        LeaderboardEntry(
            model_id=row.model_id,
            model_name=row.model_name,
            model_icon_key=row.model_icon_key or "",
            provider=row.provider,
            avg_score=round(float(row.avg_score or 0), 2),
            total_runs=int(row.total_runs or 0),
            top_score=round(float(row.top_score or 0), 2),
            last_updated=row.last_updated,
        )
        for row in rows
    ]


@router.get("/model-summary/{model_id}")
async def get_model_summary(model_id: str, db: AsyncSession = Depends(get_db)):
    """Get detailed summary for a specific model."""
    model_result = await db.execute(select(LLMModel).where(LLMModel.id == model_id))
    model = model_result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    run_stats = await db.execute(
        select(
            func.count(Run.id).label("total_runs"),
            func.count(Run.id).filter(Run.status == "done").label("completed_runs"),
            func.count(Run.id).filter(Run.status == "failed").label("failed_runs"),
        )
        .join(TaskModelAssignment, Run.task_assignment_id == TaskModelAssignment.id)
        .where(TaskModelAssignment.model_id == model_id)
    )
    stats = run_stats.one()

    score_result = await db.execute(
        select(func.avg(Score.numeric_score))
        .join(Run, Score.run_id == Run.id)
        .join(TaskModelAssignment, Run.task_assignment_id == TaskModelAssignment.id)
        .where(TaskModelAssignment.model_id == model_id)
        .where(Score.numeric_score.isnot(None))
    )
    avg_score = score_result.scalar()

    return {
        "model_id": model.id,
        "model_name": model.name,
        "provider": model.provider,
        "total_runs": stats.total_runs,
        "completed_runs": stats.completed_runs,
        "failed_runs": stats.failed_runs,
        "avg_score": round(float(avg_score), 2) if avg_score else None,
    }


@router.get("/model-eval/{model_id}", response_model=ModelEvalSummary)
async def get_model_eval(model_id: str, db: AsyncSession = Depends(get_db)):
    """Get full evaluation summary for a model: all tasks with scores and dimension breakdowns."""
    model_result = await db.execute(select(LLMModel).where(LLMModel.id == model_id))
    model = model_result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Get all tasks with their dimensions
    tasks_result = await db.execute(
        select(Task).options(selectinload(Task.dimension)).order_by(Task.created_at.desc())
    )
    all_tasks = tasks_result.scalars().all()

    # Get all assignments for this model
    assignments_result = await db.execute(
        select(TaskModelAssignment)
        .where(TaskModelAssignment.model_id == model_id)
        .options(
            selectinload(TaskModelAssignment.runs).selectinload(Run.scores),
        )
    )
    assignments = {a.task_id: a for a in assignments_result.scalars().all()}

    task_results: list[ModelTaskResult] = []
    dimension_scores: dict[str, list[float]] = {}

    for task in all_tasks:
        dim_name = task.dimension.name if task.dimension else "Unknown"
        dim_id = task.dimension_id

        assignment = assignments.get(task.id)
        run_id = None
        run_status = None
        llm_score = None
        human_score = None
        llm_rationale = None
        human_notes = None

        if assignment and assignment.runs:
            # Get the latest run
            latest_run = sorted(assignment.runs, key=lambda r: r.created_at, reverse=True)[0]
            run_id = latest_run.id
            run_status = latest_run.status

            if latest_run.scores:
                for score in latest_run.scores:
                    if score.score_type == "llm_judge":
                        llm_score = score.numeric_score
                        llm_rationale = score.rationale
                    elif score.score_type == "manual":
                        human_score = score.numeric_score
                        human_notes = score.notes or score.rationale

                # Aggregate for dimension averages
                best_score = llm_score if llm_score is not None else human_score
                if best_score is not None:
                    if dim_name not in dimension_scores:
                        dimension_scores[dim_name] = []
                    dimension_scores[dim_name].append(best_score)

        task_results.append(ModelTaskResult(
            task_id=task.id,
            task_title=task.title,
            dimension_id=dim_id,
            dimension_name=dim_name,
            run_id=run_id,
            run_status=run_status,
            llm_score=llm_score,
            human_score=human_score,
            llm_rationale=llm_rationale,
            human_notes=human_notes,
        ))

    # Calculate dimension averages
    dimension_averages = {
        name: round(sum(scores) / len(scores), 2)
        for name, scores in dimension_scores.items()
        if scores
    }

    # Overall average
    all_scores = [s for scores_list in dimension_scores.values() for s in scores_list]
    overall_avg = round(sum(all_scores) / len(all_scores), 2) if all_scores else None

    return ModelEvalSummary(
        model_id=model.id,
        model_name=model.name,
        model_icon_key=model.icon_key or "",
        provider=model.provider,
        tasks=task_results,
        dimension_averages=dimension_averages,
        overall_avg=overall_avg,
    )


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    """Get an overall summary with all models and their dimension-level scores."""
    models_result = await db.execute(
        select(LLMModel).where(LLMModel.status == "active").order_by(LLMModel.name)
    )
    all_models = models_result.scalars().all()

    dims_result = await db.execute(select(Dimension).order_by(Dimension.name))
    all_dims = dims_result.scalars().all()

    summary = []
    for model in all_models:
        model_data = {
            "model_id": model.id,
            "model_name": model.name,
            "model_icon_key": model.icon_key or "",
            "provider": model.provider,
            "dimensions": {},
            "overall_avg": None,
        }

        all_scores_list: list[float] = []

        for dim in all_dims:
            score_result = await db.execute(
                select(func.avg(Score.numeric_score))
                .join(Run, Score.run_id == Run.id)
                .join(TaskModelAssignment, Run.task_assignment_id == TaskModelAssignment.id)
                .join(Task, TaskModelAssignment.task_id == Task.id)
                .where(TaskModelAssignment.model_id == model.id)
                .where(Task.dimension_id == dim.id)
                .where(Run.status == "done")
                .where(Score.numeric_score.isnot(None))
            )
            avg = score_result.scalar()
            if avg is not None:
                avg_val = round(float(avg), 2)
                model_data["dimensions"][dim.name] = avg_val
                all_scores_list.append(avg_val)

        if all_scores_list:
            model_data["overall_avg"] = round(sum(all_scores_list) / len(all_scores_list), 2)

        summary.append(model_data)

    summary.sort(key=lambda x: x["overall_avg"] or 0, reverse=True)

    return {
        "dimensions": [{"id": d.id, "name": d.name, "slug": d.slug} for d in all_dims],
        "models": summary,
    }
