from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import Task, TaskModelAssignment
from app.schemas.schemas import AssignmentCreate, AssignmentResponse, TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
async def list_tasks(dimension_id: str | None = None, db: AsyncSession = Depends(get_db)):
    query = select(Task).order_by(Task.created_at.desc())
    if dimension_id:
        query = query.where(Task.dimension_id == dimension_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    task = Task(**data.model_dump())
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    await db.flush()
    await db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await db.delete(task)


@router.post("/{task_id}/assignments", response_model=AssignmentResponse, status_code=201)
async def create_assignment(task_id: str, data: AssignmentCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    assignment = TaskModelAssignment(task_id=task_id, model_id=data.model_id, override_params=data.override_params)
    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment


@router.get("/{task_id}/assignments", response_model=list[AssignmentResponse])
async def list_assignments(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TaskModelAssignment)
        .where(TaskModelAssignment.task_id == task_id)
        .options(selectinload(TaskModelAssignment.model))
    )
    return result.scalars().all()
