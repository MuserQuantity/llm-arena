"""LLM Judge auto-scoring: calls a judge model to score a run's output."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import LLMModel, Run, Score, SystemSetting, Task, TaskModelAssignment
from app.schemas.schemas import ScoreResponse

router = APIRouter(prefix="/api/judge", tags=["judge"])


@router.post("/score/{run_id}", response_model=ScoreResponse)
async def judge_score_run(run_id: str, db: AsyncSession = Depends(get_db)):
    """Use the LLM judge to auto-score a completed run."""
    import httpx

    from app.config import settings as app_settings
    from app.database import async_session
    from app.utils.url_validation import validate_api_url

    # Load run with relationships
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
    if run.status != "done":
        raise HTTPException(status_code=400, detail="Can only judge completed runs")
    if not run.output:
        raise HTTPException(status_code=400, detail="Run has no output to judge")

    assignment = run.task_assignment
    task = assignment.task
    dimension = task.dimension

    # Get judge model: task-specific > global setting > fallback
    judge_model_id = task.judge_model_id

    if not judge_model_id:
        setting_result = await db.execute(
            select(SystemSetting).where(SystemSetting.key == "judge_model_id")
        )
        setting = setting_result.scalar_one_or_none()
        if setting and setting.value:
            judge_model_id = setting.value

    if not judge_model_id:
        raise HTTPException(status_code=400, detail="No judge model configured. Set one in Settings or on the task.")

    judge_result = await db.execute(select(LLMModel).where(LLMModel.id == judge_model_id))
    judge_model = judge_result.scalar_one_or_none()
    if not judge_model:
        raise HTTPException(status_code=400, detail="Judge model not found")

    # Get rubric: task-specific > global setting
    rubric = task.judge_rubric
    if not rubric:
        rubric_result = await db.execute(
            select(SystemSetting).where(SystemSetting.key == "judge_rubric")
        )
        rubric_setting = rubric_result.scalar_one_or_none()
        if rubric_setting and rubric_setting.value:
            rubric = rubric_setting.value

    # Get score scale
    scale_result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "score_scale_max")
    )
    scale_setting = scale_result.scalar_one_or_none()
    score_max = int(scale_setting.value) if scale_setting and scale_setting.value else 10

    # Build the judge prompt
    judge_prompt = (
        f"You are an expert evaluator. Score the following LLM output.\n\n"
        f"## Task\n{task.prompt}\n\n"
        f"## Dimension\n{dimension.name + ': ' + dimension.description if dimension else 'N/A'}\n\n"
        f"## Evaluation Rubric\n{rubric or 'Score based on overall quality, correctness, and completeness.'}\n\n"
        f"## LLM Output to Evaluate\n{run.output[:8000]}\n\n"
        f"## Instructions\n"
        f"Provide a numeric score from 1 to {score_max} and a brief rationale.\n"
        f"Format your response EXACTLY as:\n"
        f"SCORE: <number>\n"
        f"RATIONALE: <your explanation>"
    )

    # Prepare API call
    api_base = judge_model.api_base or app_settings.llm_api_base_url
    api_key = judge_model.api_key_encrypted or app_settings.llm_api_key
    await validate_api_url(api_base)

    # Extract data before releasing DB
    judge_model_id_str = judge_model.model_id
    dimension_id = dimension.id if dimension else None

    # Release DB and call LLM
    await db.commit()

    score_value = None
    rationale = ""
    error = ""

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": judge_model_id_str,
                "messages": [{"role": "user", "content": judge_prompt}],
                "temperature": 0.3,
            }

            resp = await client.post(f"{api_base}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            response_text = data["choices"][0]["message"]["content"]

            # Parse score and rationale
            score_value, rationale = _parse_judge_response(response_text, score_max)

    except Exception as e:
        error = str(e)

    # Save score in new session
    async with async_session() as write_session:
        try:
            # Remove existing LLM judge score for this run if any
            existing = await write_session.execute(
                select(Score).where(Score.run_id == run_id, Score.score_type == "llm_judge")
            )
            for old_score in existing.scalars().all():
                await write_session.delete(old_score)

            if error:
                raise HTTPException(status_code=500, detail=f"Judge scoring failed: {error}")

            score = Score(
                run_id=run_id,
                score_type="llm_judge",
                numeric_score=score_value,
                rationale=rationale,
                scorer_model_id=judge_model_id,
                dimension_id=dimension_id,
            )
            write_session.add(score)
            await write_session.flush()
            await write_session.refresh(score)
            await write_session.commit()
            return score
        except HTTPException:
            await write_session.rollback()
            raise
        except Exception:
            await write_session.rollback()
            raise


def _parse_judge_response(text: str, max_score: int) -> tuple[float | None, str]:
    """Parse SCORE: X and RATIONALE: ... from judge response."""
    import re

    score = None
    rationale = text

    # Try to find SCORE: pattern
    score_match = re.search(r"SCORE:\s*(\d+(?:\.\d+)?)", text, re.IGNORECASE)
    if score_match:
        raw_score = float(score_match.group(1))
        score = max(1.0, min(raw_score, float(max_score)))

    # Try to find RATIONALE: pattern
    rationale_match = re.search(r"RATIONALE:\s*(.+)", text, re.IGNORECASE | re.DOTALL)
    if rationale_match:
        rationale = rationale_match.group(1).strip()

    return score, rationale
