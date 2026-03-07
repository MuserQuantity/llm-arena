from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import LLMModel, Run, Score, Task, TaskModelAssignment
from app.schemas.schemas import LeaderboardEntry

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(dimension_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Get leaderboard data with average scores per model."""
    # Build a query that joins models -> assignments -> runs -> scores
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
    # Get model info
    model_result = await db.execute(select(LLMModel).where(LLMModel.id == model_id))
    model = model_result.scalar_one_or_none()
    if not model:
        return {"error": "Model not found"}

    # Get run stats
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

    # Get average score
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
