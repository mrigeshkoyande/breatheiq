"""Authentication, JWT rotation, lockout protection, and account management endpoints."""

import logging
import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated, Literal

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_one_time_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.app_data import (
    Household,
    HouseholdMember,
    ImpactLog,
    Room,
    RoutineTask,
    SmogAlertNotification,
    SmogAlertRule,
)
from app.models.auth import AuditLog, LoginAttempt, OneTimeToken, RefreshToken, User
from app.schemas.auth import (
    AuthConfigResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    SessionResponse,
    SignupRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
    VerifyEmailRequest,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])
VERCEL_ORIGIN_PATTERN = re.compile(r"^https://[a-zA-Z0-9-]+\.vercel\.app$")


def ensure_utc(dt: datetime) -> datetime:
    """Normalize naive SQLite timestamps to UTC-aware datetimes."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def log_audit(
    db: AsyncSession,
    user_id: int | None,
    action: str,
    request: Request,
    details: str = "",
) -> None:
    """Append a security audit trail entry to the active transaction."""
    client_ip = request.client.host if request.client else "unknown"
    db.add(
        AuditLog(
            user_id=user_id,
            action=action,
            ip_address=client_ip,
            details=details,
        )
    )


def _set_refresh_cookie(response: Response, raw_refresh: str) -> None:
    samesite: Literal["lax", "strict", "none"] = settings.COOKIE_SAMESITE
    response.set_cookie(
        key="breatheiq_refresh",
        value=raw_refresh,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=samesite,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/",
    )


def _validate_csrf_origin(request: Request) -> None:
    """Reject cross-origin cookie-bearing refresh/logout calls from unknown origins."""
    origin = request.headers.get("origin")
    if not origin:
        return
    normalized = origin.rstrip("/")
    expected_host = str(request.base_url).rstrip("/")
    allowed = set(settings.ALLOWED_ORIGINS) if isinstance(settings.ALLOWED_ORIGINS, list) else set()
    if normalized == expected_host or normalized in allowed or VERCEL_ORIGIN_PATTERN.match(normalized):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Cross-origin cookie request rejected",
    )


async def _issue_session_tokens(
    db: AsyncSession, user: User, request: Request, response: Response, audit_action: str, audit_detail: str
) -> TokenResponse:
    family_id = str(uuid.uuid4())
    raw_refresh, jti_h, expires_at = create_refresh_token(user.id, family_id)
    db.add(
        RefreshToken(
            user_id=user.id,
            family_id=family_id,
            jti_hash=jti_h,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
            expires_at=expires_at,
        )
    )
    log_audit(db, user.id, audit_action, request, audit_detail)
    await db.commit()

    _set_refresh_cookie(response, raw_refresh)
    access_token = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


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
    existing = await db.execute(select(User).where(User.email == normalized_email))
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed. An account with this email may already exist.",
        )

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

    return await _issue_session_tokens(db, user, request, response, "AUTH_SIGNUP_SUCCESS", "Account created")


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

    attempt_res = await db.execute(select(LoginAttempt).where(LoginAttempt.email == normalized_email))
    attempt = attempt_res.scalars().first()
    if attempt and attempt.locked_until and ensure_utc(attempt.locked_until) > now:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to repeated failed attempts. Try again later.",
        )

    user_res = await db.execute(select(User).where(User.email == normalized_email))
    user = user_res.scalars().first()
    generic_error = "Invalid credentials. Please verify your email and password."

    if not user or not verify_password(payload.password, user.hashed_password):
        if attempt is None:
            attempt = LoginAttempt(email=normalized_email, failed_count=1, updated_at=now)
            db.add(attempt)
        else:
            attempt.failed_count += 1
            attempt.updated_at = now
        if attempt.failed_count >= settings.AUTH_LOCKOUT_THRESHOLD:
            attempt.locked_until = now + timedelta(minutes=settings.AUTH_LOCKOUT_MINUTES)
        log_audit(db, user.id if user else None, "AUTH_LOGIN_FAILED", request, "Invalid credentials attempt")
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=generic_error)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact support.",
        )

    if attempt is not None:
        attempt.failed_count = 0
        attempt.locked_until = None
        attempt.updated_at = now

    return await _issue_session_tokens(db, user, request, response, "AUTH_LOGIN_SUCCESS", "Login successful")


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    breatheiq_refresh: Annotated[str | None, Cookie()] = None,
) -> TokenResponse:
    """Rotate refresh cookie and revoke token family on reuse detection."""
    _validate_csrf_origin(request)
    if not breatheiq_refresh:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token required")

    try:
        decoded = decode_token(breatheiq_refresh)
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = int(str(decoded["sub"]))
        family_id = str(decoded["family_id"])
        jti = str(decoded["jti"])
    except HTTPException:
        raise
    except (jwt.PyJWTError, KeyError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    jti_h = hash_token(jti)
    now = datetime.now(UTC)

    res = await db.execute(select(RefreshToken).where(RefreshToken.jti_hash == jti_h))
    token_record = res.scalars().first()

    if not token_record or token_record.revoked_at is not None:
        await db.execute(
            update(RefreshToken).where(RefreshToken.family_id == family_id).values(revoked_at=now)
        )
        log_audit(db, user_id, "AUTH_REFRESH_TOKEN_REUSE_DETECTED", request, f"Family {family_id} revoked")
        await db.commit()
        response.delete_cookie("breatheiq_refresh", path="/")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session security compromise detected. Please log in again.",
        )

    if ensure_utc(token_record.expires_at) < now:
        token_record.revoked_at = now
        await db.commit()
        response.delete_cookie("breatheiq_refresh", path="/")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    token_record.revoked_at = now
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user or not user.is_active:
        await db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive")

    new_raw_refresh, new_jti_h, new_expires_at = create_refresh_token(user.id, family_id)
    db.add(
        RefreshToken(
            user_id=user.id,
            family_id=family_id,
            jti_hash=new_jti_h,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
            expires_at=new_expires_at,
        )
    )
    await db.commit()
    _set_refresh_cookie(response, new_raw_refresh)

    new_access = create_access_token(user.id, user.role)
    return TokenResponse(
        access_token=new_access,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    breatheiq_refresh: Annotated[str | None, Cookie()] = None,
) -> MessageResponse:
    """Revoke current refresh token and clear session cookie."""
    _validate_csrf_origin(request)
    if breatheiq_refresh:
        try:
            decoded = decode_token(breatheiq_refresh)
            jti = decoded.get("jti")
            if isinstance(jti, str) and jti:
                jti_h = hash_token(jti)
                await db.execute(
                    update(RefreshToken)
                    .where(RefreshToken.jti_hash == jti_h)
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    now = datetime.now(UTC)
    current_user.hashed_password = hash_password(payload.new_password)
    await db.execute(
        update(RefreshToken).where(RefreshToken.user_id == current_user.id).values(revoked_at=now)
    )
    log_audit(db, current_user.id, "AUTH_PASSWORD_CHANGED", request, "Password updated and sessions revoked")
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
    # Clean child tables explicitly alongside FK cascade for SQLite compatibility
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
    res = await db.execute(
        select(RefreshToken).where(
            RefreshToken.id == session_id,
            RefreshToken.user_id == current_user.id,
        )
    )
    token = res.scalars().first()
    if not token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    token.revoked_at = datetime.now(UTC)
    await db.commit()
    return MessageResponse(message="Session successfully revoked")


@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Create a single-use password reset token without leaking account existence or raw tokens."""
    res = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = res.scalars().first()
    if user:
        _raw_token, jti_h, expires_at = create_one_time_token(
            user.id, "reset_password", expires_minutes=30
        )
        db.add(
            OneTimeToken(
                user_id=user.id,
                jti_hash=jti_h,
                purpose="reset_password",
                expires_at=expires_at,
            )
        )
        log_audit(db, user.id, "AUTH_PASSWORD_RESET_REQUESTED", request, "Reset token issued")
        await db.commit()

    return MessageResponse(
        message="If that email is registered, password reset instructions have been generated.",
    )


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Validate single-use reset JWT, update password, and revoke existing sessions."""
    try:
        decoded = decode_token(payload.token)
        if decoded.get("type") != "one_time" or decoded.get("purpose") != "reset_password":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
        user_id = int(str(decoded["sub"]))
        jti = str(decoded["jti"])
    except HTTPException:
        raise
    except (jwt.PyJWTError, KeyError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token"
        ) from exc

    jti_h = hash_token(jti)
    now = datetime.now(UTC)
    res = await db.execute(select(OneTimeToken).where(OneTimeToken.jti_hash == jti_h))
    token_rec = res.scalars().first()

    if not token_rec or token_rec.used_at is not None or ensure_utc(token_rec.expires_at) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Token already used or expired"
        )

    token_rec.used_at = now
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.hashed_password = hash_password(payload.new_password)
    await db.execute(
        update(RefreshToken).where(RefreshToken.user_id == user.id).values(revoked_at=now)
    )
    log_audit(db, user.id, "AUTH_PASSWORD_RESET_SUCCESS", request, "Password reset and sessions revoked")
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
    try:
        decoded = decode_token(payload.token)
        if decoded.get("type") != "one_time" or decoded.get("purpose") != "verify_email":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
        user_id = int(str(decoded["sub"]))
        jti = str(decoded["jti"])
    except HTTPException:
        raise
    except (jwt.PyJWTError, KeyError, ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token"
        ) from exc

    jti_h = hash_token(jti)
    now = datetime.now(UTC)
    res = await db.execute(select(OneTimeToken).where(OneTimeToken.jti_hash == jti_h))
    token_rec = res.scalars().first()

    if not token_rec or token_rec.used_at is not None or ensure_utc(token_rec.expires_at) < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Token already used or expired"
        )

    token_rec.used_at = now
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalars().first()
    if user:
        user.is_verified = True
    await db.commit()

    return MessageResponse(message="Email address successfully verified.")
