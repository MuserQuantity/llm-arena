from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import Dimension
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
