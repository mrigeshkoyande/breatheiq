"""Authentication and role-based access control dependencies."""

import logging
from collections.abc import Callable, Coroutine
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.auth import User

__all__ = [
    "get_current_user",
    "get_current_user_optional",
    "get_db",
    "require_role",
    "security_scheme",
]

logger = logging.getLogger(__name__)
security_scheme = HTTPBearer(auto_error=False)


def _extract_access_user_id(token: str) -> int:
    """Decode and validate an access JWT token and return its integer user ID.

    Args:
        token: Raw Bearer JWT string.

    Returns:
        Integer primary key extracted from the ``sub`` claim.

    Raises:
        AuthenticationError: If token signature, expiry, type, or subject is invalid.
    """
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type")
        sub_raw = payload.get("sub")
        if sub_raw is None:
            raise ValueError("Missing token subject")
        return int(sub_raw)
    except AuthenticationError:
        raise
    except (jwt.PyJWTError, ValueError, TypeError) as exc:
        raise AuthenticationError("Could not validate credentials") from exc


def _unauthorized(detail: str) -> HTTPException:
    """Create standardized HTTP 401 Bearer challenge exception."""
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def _fetch_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """Retrieve user row by primary key from active DB session."""
    return (await db.execute(select(User).where(User.id == user_id))).scalars().first()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Validate Bearer access JWT and re-verify active user state from the database."""
    if not credentials:
        raise _unauthorized("Authentication required")
    try:
        user_id = _extract_access_user_id(credentials.credentials)
    except AuthenticationError as exc:
        raise _unauthorized(exc.detail) from exc

    user = await _fetch_user_by_id(db, user_id)
    if not user:
        raise _unauthorized("User not found")
    if not user.is_active:
        raise AuthorizationError("Inactive user account")
    return user


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """Return authenticated active user when Bearer JWT is valid, else ``None``."""
    if not credentials:
        return None
    try:
        user_id = _extract_access_user_id(credentials.credentials)
    except AuthenticationError as exc:
        logger.debug("Optional token ignored: %s", exc.detail)
        return None

    user = await _fetch_user_by_id(db, user_id)
    return user if user and user.is_active else None


def require_role(*allowed_roles: str) -> Callable[..., Coroutine[Any, Any, User]]:
    """Dependency factory enforcing database-backed user role membership."""

    async def role_checker(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        """Verify authenticated user belongs to ``allowed_roles``."""
        if user.role not in allowed_roles:
            raise AuthorizationError("Insufficient permissions for this operation")
        return user

    return role_checker
