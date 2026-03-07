from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Run, Score
from app.schemas.schemas import ScoreCreate, ScoreResponse, ScoreUpdate

router = APIRouter(prefix="/api", tags=["scores"])


@router.post("/runs/{run_id}/scores", response_model=ScoreResponse, status_code=201)
async def create_score(run_id: str, data: ScoreCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    score = Score(run_id=run_id, **data.model_dump())
    db.add(score)
    await db.flush()
    await db.refresh(score)
    return score


@router.get("/runs/{run_id}/scores", response_model=list[ScoreResponse])
async def list_scores(run_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Score).where(Score.run_id == run_id).order_by(Score.created_at))
    return result.scalars().all()


@router.patch("/scores/{score_id}", response_model=ScoreResponse)
async def update_score(score_id: str, data: ScoreUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Score).where(Score.id == score_id))
    score = result.scalar_one_or_none()
    if not score:
        raise HTTPException(status_code=404, detail="Score not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(score, key, value)
    await db.flush()
    await db.refresh(score)
    return score
