"""Adaptive daily smog routine endpoints."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ResourceNotFoundError
from app.db.seed_data import DEMO_TASKS
from app.models.app_data import RoutineTask
from app.models.auth import User
from app.schemas.app_schemas import RoutineTaskResponse, TaskCreateSchema

router = APIRouter()


async def _get_owned_task(db: AsyncSession, task_id: int, user_id: int) -> RoutineTask:
    """Fetch a routine task owned by caller or raise ``ResourceNotFoundError``."""
    task = (
        (
            await db.execute(
                select(RoutineTask).where(RoutineTask.id == task_id, RoutineTask.user_id == user_id)
            )
        )
        .scalars()
        .first()
    )
    if not task:
        raise ResourceNotFoundError("Task not found")
    return task


@router.get("/routine", response_model=list[RoutineTaskResponse])
async def get_routine_tasks(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[RoutineTaskResponse]:
    """List or provision today's adaptive smog routine tasks."""
    today_str = date.today().isoformat()
    stmt = select(RoutineTask).where(
        RoutineTask.user_id == user.id, RoutineTask.date_str == today_str
    )
    tasks = list((await db.execute(stmt)).scalars().all())
    if not tasks:
        seed_tasks = [
            RoutineTask(
                user_id=user.id,
                title=title,
                time_slot=slot,
                category=category,
                description=desc,
                is_completed=done,
                date_str=today_str,
            )
            for title, slot, category, done, desc in DEMO_TASKS
        ]
        db.add_all(seed_tasks)
        await db.commit()
        tasks = list((await db.execute(stmt)).scalars().all())
    return [RoutineTaskResponse.model_validate(t) for t in tasks]


@router.post("/routine", response_model=RoutineTaskResponse)
async def add_routine_task(
    req: TaskCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> RoutineTaskResponse:
    """Create a custom adaptive routine task for today."""
    task = RoutineTask(
        user_id=user.id,
        date_str=date.today().isoformat(),
        is_completed=False,
        **req.model_dump(),
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return RoutineTaskResponse.model_validate(task)


@router.patch("/routine/{task_id}/toggle", response_model=RoutineTaskResponse)
async def toggle_routine_task(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> RoutineTaskResponse:
    """Toggle completion status on an owned routine task."""
    task = await _get_owned_task(db, task_id, user.id)
    task.is_completed = not task.is_completed
    await db.commit()
    await db.refresh(task)
    return RoutineTaskResponse.model_validate(task)


@router.delete("/routine/{task_id}")
async def delete_routine_task(
    task_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Delete an owned routine task."""
    task = await _get_owned_task(db, task_id, user.id)
    await db.delete(task)
    await db.commit()
    return {"message": "Task removed"}
