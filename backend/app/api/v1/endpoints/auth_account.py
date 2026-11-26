"""Authenticated user profile, session revocation, password reset, and verification routes."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.v1.endpoints.auth_recovery import router as recovery_router
from app.core.exceptions import DomainValidationError, ResourceNotFoundError
from app.core.security import hash_password, verify_password
from app.models.app_data import (
    Household,
    HouseholdMember,
    ImpactLog,
    Room,
    RoutineTask,
    SmogAlertNotification,
    SmogAlertRule,
)
from app.models.auth import OneTimeToken, RefreshToken, User
from app.schemas.auth import (
    ChangePasswordRequest,
    MessageResponse,
    SessionResponse,
    UpdateProfileRequest,
    UserResponse,
)
from app.services.auth_service import log_audit

router = APIRouter()
router.include_router(recovery_router)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserResponse:
    """Return authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    payload: UpdateProfileRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    """Persist display name changes for the authenticated user."""
    current_user.full_name = payload.full_name.strip()
    log_audit(db, current_user.id, "AUTH_PROFILE_UPDATED", request, "Updated display profile")
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Verify current password, update Argon2id hash, and revoke active refresh tokens."""
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise DomainValidationError(
            "Current password is incorrect.", status_code=status.HTTP_400_BAD_REQUEST
        )

    current_user.hashed_password = hash_password(payload.new_password)
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == current_user.id)
        .values(revoked_at=datetime.now(UTC))
    )
    log_audit(
        db,
        current_user.id,
        "AUTH_PASSWORD_CHANGED",
        request,
        "Password updated and sessions revoked",
    )
    await db.commit()
    response.delete_cookie("breatheiq_refresh", path="/")
    return MessageResponse(message="Password updated successfully.")


@router.delete("/me", response_model=MessageResponse)
async def delete_me(
    request: Request,
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Permanently delete the authenticated user and all personal telemetry data."""
    uid = current_user.id
    for model in (
        SmogAlertNotification,
        SmogAlertRule,
        ImpactLog,
        RoutineTask,
        Room,
        HouseholdMember,
        Household,
        OneTimeToken,
        RefreshToken,
    ):
        await db.execute(delete(model).where(model.user_id == uid))

    log_audit(db, None, "AUTH_ACCOUNT_DELETED", request, f"Deleted account id={uid}")
    await db.delete(current_user)
    await db.commit()
    response.delete_cookie("breatheiq_refresh", path="/")
    return MessageResponse(message="Account and associated personal records permanently deleted.")


@router.get("/sessions", response_model=list[SessionResponse])
async def get_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[SessionResponse]:
    """List refresh token families for session management."""
    res = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.user_id == current_user.id)
        .order_by(RefreshToken.created_at.desc())
    )
    return [
        SessionResponse(
            id=t.id,
            family_id=t.family_id,
            user_agent=t.user_agent,
            ip_address=t.ip_address,
            created_at=t.created_at.isoformat(),
            expires_at=t.expires_at.isoformat(),
            is_revoked=t.revoked_at is not None,
        )
        for t in res.scalars().all()
    ]


@router.delete("/sessions/{session_id}", response_model=MessageResponse)
async def revoke_session(
    session_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Revoke a specific refresh token record owned by the caller."""
    token = (
        (
            await db.execute(
                select(RefreshToken).where(
                    RefreshToken.id == session_id, RefreshToken.user_id == current_user.id
                )
            )
        )
        .scalars()
        .first()
    )
    if not token:
        raise ResourceNotFoundError("Session not found")
    token.revoked_at = datetime.now(UTC)
    await db.commit()
    return MessageResponse(message="Session successfully revoked")
