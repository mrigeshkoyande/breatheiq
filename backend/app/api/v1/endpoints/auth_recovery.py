"""Single-use password reset and email verification endpoints."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.constants import ONE_TIME_TOKEN_TTL_MINUTES
from app.core.exceptions import ResourceNotFoundError
from app.core.rate_limit import limiter
from app.core.security import create_one_time_token, hash_password
from app.models.auth import OneTimeToken, RefreshToken, User
from app.schemas.auth import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    VerifyEmailRequest,
)
from app.services.auth_service import consume_one_time_token, log_audit

router = APIRouter()


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Create a single-use password reset token without leaking account existence."""
    user = (
        (await db.execute(select(User).where(User.email == payload.email.lower())))
        .scalars()
        .first()
    )
    if user:
        _, jti_h, expires_at = create_one_time_token(
            user.id, "reset_password", expires_minutes=ONE_TIME_TOKEN_TTL_MINUTES
        )
        db.add(
            OneTimeToken(
                user_id=user.id, jti_hash=jti_h, purpose="reset_password", expires_at=expires_at
            )
        )
        log_audit(db, user.id, "AUTH_PASSWORD_RESET_REQUESTED", request, "Reset token issued")
        await db.commit()
    return MessageResponse(
        message="If that email is registered, password reset instructions have been generated."
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Validate single-use reset JWT, update password, and revoke existing sessions."""
    user_id = await consume_one_time_token(db, payload.token, "reset_password")
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user:
        raise ResourceNotFoundError("User not found")
    now = datetime.now(UTC)
    user.hashed_password = hash_password(payload.new_password)
    await db.execute(
        update(RefreshToken).where(RefreshToken.user_id == user.id).values(revoked_at=now)
    )
    log_audit(
        db, user.id, "AUTH_PASSWORD_RESET_SUCCESS", request, "Password reset and sessions revoked"
    )
    await db.commit()
    return MessageResponse(
        message="Password successfully reset. You may now log in with your new password."
    )


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(
    payload: VerifyEmailRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Verify user email via single-use signed JWT token."""
    user_id = await consume_one_time_token(db, payload.token, "verify_email")
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if user:
        user.is_verified = True
    await db.commit()
    return MessageResponse(message="Email address successfully verified.")
