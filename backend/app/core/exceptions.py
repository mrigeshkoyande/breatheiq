"""Typed application exception hierarchy mapped cleanly at the API boundary."""

from fastapi import status


class BreatheIQError(Exception):
    """Base application exception carrying HTTP status and safe public detail."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, detail: str, status_code: int | None = None) -> None:
        """Initialize an application error with an explicit client-safe detail."""
        super().__init__(detail)
        self.detail = detail
        if status_code is not None:
            self.status_code = status_code


class AuthenticationError(BreatheIQError):
    """Raised when credentials or JWT tokens are missing, expired, or invalid."""

    status_code = status.HTTP_401_UNAUTHORIZED


class AuthorizationError(BreatheIQError):
    """Raised when an authenticated principal lacks permissions for a resource."""

    status_code = status.HTTP_403_FORBIDDEN


class ResourceNotFoundError(BreatheIQError):
    """Raised when a requested entity does not exist or is not owned by the caller."""

    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(BreatheIQError):
    """Raised on conflicting state such as duplicate email registration."""

    status_code = status.HTTP_400_BAD_REQUEST


class DomainValidationError(BreatheIQError, ValueError):
    """Raised when domain inputs violate scientific or physical constraints."""

    status_code = status.HTTP_400_BAD_REQUEST


class ExternalProviderError(BreatheIQError):
    """Raised when an external air-data or GenAI upstream request fails."""

    status_code = status.HTTP_502_BAD_GATEWAY
