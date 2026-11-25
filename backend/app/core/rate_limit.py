"""Rate limiter configuration for BreatheIQ API endpoints."""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings


def get_client_key(request: Request) -> str:
    """Resolve stable client identifier honoring trusted X-Forwarded-For."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        first_hop = forwarded.split(",")[0].strip()
        if first_hop:
            return first_hop
    return get_remote_address(request)


limiter = Limiter(
    key_func=get_client_key,
    enabled=settings.RATE_LIMIT_ENABLED,
)
