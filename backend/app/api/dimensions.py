from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Dimension, Task
from app.schemas.schemas import DimensionCreate, DimensionResponse, DimensionUpdate

router = APIRouter(prefix="/api/dimensions", tags=["dimensions"])


@router.get("", response_model=list[DimensionResponse])
async def list_dimensions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dimension).order_by(Dimension.name))
    return result.scalars().all()


@router.post("", response_model=DimensionResponse, status_code=201)
async def create_dimension(data: DimensionCreate, db: AsyncSession = Depends(get_db)):
    dim = Dimension(name=data.name, slug=data.slug, description=data.description)
    db.add(dim)
    await db.flush()
    await db.refresh(dim)
    return dim


@router.patch("/{dimension_id}", response_model=DimensionResponse)
async def update_dimension(dimension_id: str, data: DimensionUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dimension).where(Dimension.id == dimension_id))
    dim = result.scalar_one_or_none()
    if not dim:
        raise HTTPException(status_code=404, detail="Dimension not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(dim, key, value)
    await db.flush()
    await db.refresh(dim)
    return dim


@router.delete("/{dimension_id}", status_code=204)
async def delete_dimension(dimension_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dimension).where(Dimension.id == dimension_id))
    dim = result.scalar_one_or_none()
    if not dim:
        raise HTTPException(status_code=404, detail="Dimension not found")

    task_count_result = await db.execute(
        select(func.count()).select_from(Task).where(Task.dimension_id == dimension_id)
    )
    task_count = task_count_result.scalar() or 0
    if task_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"该维度下还有 {task_count} 个任务，请先删除或转移这些任务",
        )

    await db.delete(dim)
    await db.flush()
