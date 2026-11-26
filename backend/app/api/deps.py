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


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Security(security_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Validate Bearer access JWT and re-verify active user state from the database.

    Args:
        credentials: Parsed HTTP Bearer token credentials.
        db: Active async database session.

    Returns:
        Active persisted ``User`` row matching the token subject.

    Raises:
        HTTPException: 401 on missing/invalid token or 403 on disabled account.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = _extract_access_user_id(credentials.credentials)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.detail,
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
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

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
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
