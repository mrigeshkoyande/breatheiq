"""Indoor room configuration and particulate reading endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ResourceNotFoundError
from app.models.app_data import Room, RoomReading
from app.models.auth import User
from app.schemas.app_schemas import (
    ReadingCreateSchema,
    RoomCreateSchema,
    RoomReadingResponse,
    RoomResponse,
)

router = APIRouter()


async def _get_owned_room(db: AsyncSession, room_id: int, user_id: int) -> Room:
    """Fetch a room verifying caller ownership or raise ``ResourceNotFoundError``."""
    room = (
        (await db.execute(select(Room).where(Room.id == room_id, Room.user_id == user_id)))
        .scalars()
        .first()
    )
    if not room:
        raise ResourceNotFoundError("Room not found")
    return room


@router.get("/rooms", response_model=list[RoomResponse])
async def list_rooms(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[RoomResponse]:
    """List rooms configured for the caller's household."""
    rooms = list((await db.execute(select(Room).where(Room.user_id == user.id))).scalars().all())
    if not rooms:
        defaults = [
            Room(
                user_id=user.id,
                name="Living Room",
                length_m=5.0,
                width_m=4.0,
                height_m=2.7,
                has_purifier=True,
                purifier_cadr=350.0,
            ),
            Room(
                user_id=user.id,
                name="Master Bedroom",
                length_m=4.2,
                width_m=3.6,
                height_m=2.7,
                has_purifier=True,
                purifier_cadr=250.0,
            ),
        ]
        db.add_all(defaults)
        await db.commit()
        rooms = list(
            (await db.execute(select(Room).where(Room.user_id == user.id))).scalars().all()
        )
    return [RoomResponse.model_validate(r) for r in rooms]


@router.post("/rooms", response_model=RoomResponse)
async def add_room(
    req: RoomCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> RoomResponse:
    """Create a room profile for purifier sizing and indoor readings."""
    room = Room(user_id=user.id, **req.model_dump())
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return RoomResponse.model_validate(room)


@router.delete("/rooms/{room_id}")
async def delete_room(
    room_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Delete an owned room profile."""
    room = await _get_owned_room(db, room_id, user.id)
    await db.delete(room)
    await db.commit()
    return {"message": "Room removed"}


@router.get("/rooms/{room_id}/readings", response_model=list[RoomReadingResponse])
async def get_room_readings(
    room_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[RoomReadingResponse]:
    """Retrieve indoor sensor/manual readings for an owned room."""
    await _get_owned_room(db, room_id, user.id)
    readings = list(
        (
            await db.execute(
                select(RoomReading)
                .where(RoomReading.room_id == room_id)
                .order_by(RoomReading.timestamp.desc())
                .limit(20)
            )
        )
        .scalars()
        .all()
    )
    if not readings:
        initial = RoomReading(
            room_id=room_id,
            pm25=28.0,
            co2=620.0,
            temperature_c=25.5,
            humidity_pct=58.0,
            source="Manual",
        )
        db.add(initial)
        await db.commit()
        await db.refresh(initial)
        readings = [initial]
    return [RoomReadingResponse.model_validate(r) for r in readings]


@router.post("/rooms/{room_id}/readings", response_model=RoomReadingResponse)
async def add_room_reading(
    room_id: int,
    req: ReadingCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> RoomReadingResponse:
    """Record a new indoor reading for an owned room."""
    await _get_owned_room(db, room_id, user.id)
    reading = RoomReading(room_id=room_id, **req.model_dump())
    db.add(reading)
    await db.commit()
    await db.refresh(reading)
    return RoomReadingResponse.model_validate(reading)
