"""Authentication helpers for audit logging, cookies, CSRF checks, and token validation."""

import re
import uuid
from datetime import UTC, datetime, timedelta
from typing import Literal

import jwt
from fastapi import Request, Response, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.constants import SECONDS_PER_HOUR
from app.core.exceptions import AuthenticationError, AuthorizationError, DomainValidationError
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_token
from app.models.auth import AuditLog, LoginAttempt, OneTimeToken, RefreshToken, User
from app.schemas.auth import TokenResponse, UserResponse

VERCEL_ORIGIN_PATTERN = re.compile(r"^https://breatheiq(?:-[a-zA-Z0-9-]+)?\.vercel\.app$")
SECONDS_PER_DAY = SECONDS_PER_HOUR * 24


def ensure_utc(dt: datetime) -> datetime:
    """Normalize naive SQLite timestamps to UTC-aware datetimes."""
    return dt.replace(tzinfo=UTC) if dt.tzinfo is None else dt


def log_audit(
    db: AsyncSession, user_id: int | None, action: str, request: Request, details: str = ""
) -> None:
    """Append a security audit trail entry to the active transaction."""
    client_ip = request.client.host if request.client else "unknown"
    db.add(AuditLog(user_id=user_id, action=action, ip_address=client_ip, details=details))


def set_refresh_cookie(response: Response, raw_refresh: str) -> None:
    """Set rotating HttpOnly refresh token cookie with environment-matched security flags."""
    samesite: Literal["lax", "strict", "none"] = settings.COOKIE_SAMESITE
    response.set_cookie(
        key="breatheiq_refresh",
        value=raw_refresh,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=samesite,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * SECONDS_PER_DAY,
        path="/",
    )


def validate_csrf_origin(request: Request) -> None:
    """Reject cross-origin cookie-bearing requests from unrecognized origins."""
    origin = request.headers.get("origin")
    if not origin:
        return
    normalized = origin.rstrip("/")
    expected_host = str(request.base_url).rstrip("/")
    allowed = set(settings.ALLOWED_ORIGINS) if isinstance(settings.ALLOWED_ORIGINS, list) else set()
    is_preview_origin = settings.ENVIRONMENT != "production" and VERCEL_ORIGIN_PATTERN.match(
        normalized
    )
    if normalized == expected_host or normalized in allowed or is_preview_origin:
        return
    raise AuthorizationError("Cross-origin cookie request rejected")


def _build_refresh_record(
    user_id: int, family_id: str, jti_h: str, expires_at: datetime, request: Request
) -> RefreshToken:
    """Construct a persisted ``RefreshToken`` entity for the caller request."""
    return RefreshToken(
        user_id=user_id,
        family_id=family_id,
        jti_hash=jti_h,
        user_agent=request.headers.get("user-agent"),
        ip_address=request.client.host if request.client else None,
        expires_at=expires_at,
    )


async def issue_session_tokens(
    db: AsyncSession,
    user: User,
    request: Request,
    response: Response,
    audit_action: str,
    audit_detail: str,
    family_id: str | None = None,
) -> TokenResponse:
    """Create and persist a refresh token family entry, set cookie, and return access JWT."""
    resolved_family = family_id or str(uuid.uuid4())
    raw_refresh, jti_h, expires_at = create_refresh_token(user.id, resolved_family)
    db.add(_build_refresh_record(user.id, resolved_family, jti_h, expires_at, request))
    if audit_action:
        log_audit(db, user.id, audit_action, request, audit_detail)
    await db.commit()
    set_refresh_cookie(response, raw_refresh)
    return TokenResponse(
        access_token=create_access_token(user.id, user.role),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


async def record_failed_login(
    db: AsyncSession, email: str, user: User | None, attempt: LoginAttempt | None, request: Request
) -> None:
    """Increment failed login counter, lock account above threshold, and log audit event."""
    now = datetime.now(UTC)
    if attempt is None:
        attempt = LoginAttempt(email=email, failed_count=1, updated_at=now)
        db.add(attempt)
    else:
        attempt.failed_count += 1
        attempt.updated_at = now
    if attempt.failed_count >= settings.AUTH_LOCKOUT_THRESHOLD:
        attempt.locked_until = now + timedelta(minutes=settings.AUTH_LOCKOUT_MINUTES)
    log_audit(
        db, user.id if user else None, "AUTH_LOGIN_FAILED", request, "Invalid credentials attempt"
    )
    await db.commit()


def parse_refresh_claims(raw_token: str) -> tuple[int, str, str]:
    """Decode refresh JWT and return ``(user_id, family_id, jti)`` or raise ``AuthenticationError``."""
    try:
        decoded = decode_token(raw_token)
        if decoded.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")
        return int(str(decoded["sub"])), str(decoded["family_id"]), str(decoded["jti"])
    except AuthenticationError:
        raise
    except (jwt.PyJWTError, KeyError, ValueError, TypeError) as exc:
        raise AuthenticationError("Invalid or expired token") from exc


async def revoke_family_on_reuse(
    db: AsyncSession, user_id: int, family_id: str, request: Request, response: Response
) -> None:
    """Revoke entire refresh token family when reuse compromise is detected."""
    now = datetime.now(UTC)
    await db.execute(
        update(RefreshToken).where(RefreshToken.family_id == family_id).values(revoked_at=now)
    )
    log_audit(
        db, user_id, "AUTH_REFRESH_TOKEN_REUSE_DETECTED", request, f"Family {family_id} revoked"
    )
    await db.commit()
    response.delete_cookie("breatheiq_refresh", path="/")


async def consume_one_time_token(db: AsyncSession, raw_token: str, expected_purpose: str) -> int:
    """Decode, verify unused/unexpired state, consume single-use token, and return user ID."""
    try:
        decoded = decode_token(raw_token)
        if decoded.get("type") != "one_time" or decoded.get("purpose") != expected_purpose:
            raise DomainValidationError("Invalid token")
        user_id = int(str(decoded["sub"]))
        jti = str(decoded["jti"])
    except DomainValidationError:
        raise
    except (jwt.PyJWTError, KeyError, ValueError, TypeError) as exc:
        raise DomainValidationError(
            "Invalid or expired reset token"
            if expected_purpose == "reset_password"
            else "Invalid or expired token"
        ) from exc

    now = datetime.now(UTC)
    res = await db.execute(select(OneTimeToken).where(OneTimeToken.jti_hash == hash_token(jti)))
    token_rec = res.scalars().first()
    if not token_rec or token_rec.used_at is not None or ensure_utc(token_rec.expires_at) < now:
        raise DomainValidationError(
            "Token already used or expired", status_code=status.HTTP_400_BAD_REQUEST
        )
    token_rec.used_at = now
    return user_id
