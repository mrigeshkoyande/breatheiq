"""Authentication, JWT rotation, lockout protection, and logout endpoints."""

import logging
from datetime import UTC, datetime
from typing import Annotated

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.api.v1.endpoints.auth_account import router as account_router
from app.core.config import settings
from app.core.exceptions import AuthenticationError, AuthorizationError, ConflictError
from app.core.rate_limit import limiter
from app.core.security import decode_token, hash_password, hash_token, verify_password
from app.models.auth import LoginAttempt, RefreshToken, User
from app.schemas.auth import (
    AuthConfigResponse,
    LoginRequest,
    MessageResponse,
    SignupRequest,
    TokenResponse,
)
from app.services.auth_service import (
    ensure_utc,
    issue_session_tokens,
    log_audit,
    parse_refresh_claims,
    record_failed_login,
    revoke_family_on_reuse,
    validate_csrf_origin,
)

__all__ = ["ensure_utc", "log_audit", "router"]

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
router.include_router(account_router)


@router.get("/config", response_model=AuthConfigResponse)
def get_auth_config() -> AuthConfigResponse:
    """Expose public environment mode so UI gates demo quick-fill outside production."""
    return AuthConfigResponse(
        demo_mode=bool(settings.DEMO_MODE and settings.ENVIRONMENT != "production"),
        environment=settings.ENVIRONMENT,
    )


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def signup(
    payload: SignupRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Register a new standard user and issue an initial refresh session."""
    normalized_email = payload.email.lower()
    if (await db.execute(select(User).where(User.email == normalized_email))).scalars().first():
        raise ConflictError("Registration failed. An account with this email may already exist.")

    user = User(
        email=normalized_email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role="user",
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return await issue_session_tokens(
        db, user, request, response, "AUTH_SIGNUP_SUCCESS", "Account created"
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Authenticate user with Argon2id, lockout tracking, and rotating refresh cookie."""
    normalized_email = payload.email.lower()
    now = datetime.now(UTC)
    attempt = (
        (await db.execute(select(LoginAttempt).where(LoginAttempt.email == normalized_email)))
        .scalars()
        .first()
    )
    if attempt and attempt.locked_until and ensure_utc(attempt.locked_until) > now:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to repeated failed attempts. Try again later.",
        )

    user = (await db.execute(select(User).where(User.email == normalized_email))).scalars().first()
    if not user or not verify_password(payload.password, user.hashed_password):
        await record_failed_login(db, normalized_email, user, attempt, request)
        raise AuthenticationError("Invalid credentials. Please verify your email and password.")

    if not user.is_active:
        raise AuthorizationError("Account is disabled. Please contact support.")

    if attempt is not None:
        attempt.failed_count = 0
        attempt.locked_until = None
        attempt.updated_at = now
    return await issue_session_tokens(
        db, user, request, response, "AUTH_LOGIN_SUCCESS", "Login successful"
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    breatheiq_refresh: Annotated[str | None, Cookie()] = None,
) -> TokenResponse:
    """Rotate refresh cookie and revoke token family on reuse detection."""
    validate_csrf_origin(request)
    if not breatheiq_refresh:
        raise AuthenticationError("Refresh token required")

    user_id, family_id, jti = parse_refresh_claims(breatheiq_refresh)
    now = datetime.now(UTC)
    token_record = (
        (await db.execute(select(RefreshToken).where(RefreshToken.jti_hash == hash_token(jti))))
        .scalars()
        .first()
    )

    if not token_record or token_record.revoked_at is not None:
        await revoke_family_on_reuse(db, user_id, family_id, request, response)
        raise AuthenticationError("Session security compromise detected. Please log in again.")

    if ensure_utc(token_record.expires_at) < now:
        token_record.revoked_at = now
        await db.commit()
        response.delete_cookie("breatheiq_refresh", path="/")
        raise AuthenticationError("Session expired")

    token_record.revoked_at = now
    user = (await db.execute(select(User).where(User.id == user_id))).scalars().first()
    if not user or not user.is_active:
        await db.commit()
        raise AuthenticationError("User account inactive")

    return await issue_session_tokens(db, user, request, response, "", "", family_id=family_id)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    breatheiq_refresh: Annotated[str | None, Cookie()] = None,
) -> MessageResponse:
    """Revoke current refresh token and clear session cookie."""
    validate_csrf_origin(request)
    if breatheiq_refresh:
        try:
            decoded = decode_token(breatheiq_refresh)
            jti = decoded.get("jti")
            if isinstance(jti, str) and jti:
                await db.execute(
                    update(RefreshToken)
                    .where(RefreshToken.jti_hash == hash_token(jti))
                    .values(revoked_at=datetime.now(UTC))
                )
                await db.commit()
        except jwt.PyJWTError as exc:
            logger.debug("Ignoring malformed refresh cookie during logout: %s", type(exc).__name__)
    response.delete_cookie("breatheiq_refresh", path="/")
    return MessageResponse(message="Logged out successfully")


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all(
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Revoke all refresh sessions belonging to the authenticated user."""
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == current_user.id)
        .values(revoked_at=datetime.now(UTC))
    )
    await db.commit()
    response.delete_cookie("breatheiq_refresh", path="/")
    return MessageResponse(message="All active sessions revoked")
