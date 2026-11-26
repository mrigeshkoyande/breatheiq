"""Household, onboarding, and family AirTwin member routes."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.constants import DEFAULT_CITY_NAME
from app.core.exceptions import ResourceNotFoundError
from app.models.app_data import Household, HouseholdMember
from app.models.auth import User
from app.schemas.app_schemas import (
    HouseholdResponse,
    HouseholdSchema,
    MemberCreateSchema,
    MemberResponse,
)

router = APIRouter()

VULNERABILITY_AGE_SCORES: dict[str, int] = {
    "infant": 70,
    "child": 50,
    "senior": 65,
    "adult": 25,
}
VULNERABILITY_SENSITIVITY_SCORES: dict[str, int] = {
    "asthma": 30,
    "bronchitis": 25,
    "heart_condition": 30,
    "pregnancy": 25,
    "none": 0,
}


def compute_vulnerability_score(age_category: str, sensitivity: str) -> int:
    """Compute AirTwin vulnerability score (5-100) from age tier and sensitivity."""
    base = VULNERABILITY_AGE_SCORES.get(age_category.lower(), 30)
    sens_mod = VULNERABILITY_SENSITIVITY_SCORES.get(sensitivity.lower(), 0)
    return min(100, max(5, base + sens_mod))


@router.get("/household", response_model=HouseholdResponse)
async def get_household(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> HouseholdResponse:
    """Retrieve or initialize the user's primary household corridor."""
    household = (
        (await db.execute(select(Household).where(Household.user_id == user.id))).scalars().first()
    )
    if not household:
        household = Household(
            user_id=user.id, name="Home", city=DEFAULT_CITY_NAME, neighborhood="Andheri West"
        )
        db.add(household)
        await db.commit()
        await db.refresh(household)
    return HouseholdResponse.model_validate(household)


@router.post("/household", response_model=HouseholdResponse)
async def save_household(
    req: HouseholdSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> HouseholdResponse:
    """Create or update the user's household location corridor."""
    household = (
        (await db.execute(select(Household).where(Household.user_id == user.id))).scalars().first()
    )
    if not household:
        household = Household(user_id=user.id, **req.model_dump())
        db.add(household)
    else:
        for field, val in req.model_dump().items():
            setattr(household, field, val)
    await db.commit()
    await db.refresh(household)
    return HouseholdResponse.model_validate(household)


@router.get("/members", response_model=list[MemberResponse])
async def list_members(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> list[MemberResponse]:
    """List household member profiles belonging to the caller."""
    members = list(
        (await db.execute(select(HouseholdMember).where(HouseholdMember.user_id == user.id)))
        .scalars()
        .all()
    )
    if not members:
        primary = HouseholdMember(
            user_id=user.id,
            name=user.full_name or "Primary Member",
            age_category="adult",
            sensitivity="none",
            vulnerability_score=25,
        )
        db.add(primary)
        await db.commit()
        await db.refresh(primary)
        members = [primary]
    return [MemberResponse.model_validate(m) for m in members]


@router.post("/members", response_model=MemberResponse)
async def add_member(
    req: MemberCreateSchema,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> MemberResponse:
    """Create a family member AirTwin profile."""
    score = compute_vulnerability_score(req.age_category, req.sensitivity)
    member = HouseholdMember(
        user_id=user.id,
        name=req.name,
        age_category=req.age_category,
        sensitivity=req.sensitivity,
        vulnerability_score=score,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return MemberResponse.model_validate(member)


@router.delete("/members/{member_id}")
async def delete_member(
    member_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict[str, str]:
    """Delete a household member owned by the caller."""
    member = (
        (
            await db.execute(
                select(HouseholdMember).where(
                    HouseholdMember.id == member_id, HouseholdMember.user_id == user.id
                )
            )
        )
        .scalars()
        .first()
    )
    if not member:
        raise ResourceNotFoundError("Member not found")
    await db.delete(member)
    await db.commit()
    return {"message": "Member removed"}
