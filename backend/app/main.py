"""FastAPI application entrypoint with security headers, rate limiting, and SPA hosting."""

import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

import httpx
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.endpoints import (
    admin,
    air_quality,
    auth,
    community,
    copilot,
    engines,
    health,
    user_flow,
)
from app.core.config import settings
from app.core.exceptions import BreatheIQError
from app.core.rate_limit import limiter
from app.db.seed import seed_database
from app.services.air_data import air_data_service


async def _rate_limit_handler(request: Request, exc: Exception) -> Response:
    """Return HTTP 429 JSON error when a client exceeds rate limits."""
    _ = request
    detail = getattr(exc, "detail", "Rate limit exceeded. Please try again later.")
    return JSONResponse(status_code=429, content={"detail": f"Rate limit exceeded: {detail}"})


async def _domain_error_handler(request: Request, exc: Exception) -> Response:
    """Translate typed application domain errors into safe HTTP JSON responses."""
    _ = request
    if isinstance(exc, BreatheIQError):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach strict HTTP security headers and CSP to every response."""

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        """Apply CSP, frame, content-type, referrer, and HSTS headers."""
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https://*.tile.openstreetmap.org https://tile.openstreetmap.org; "
            "connect-src 'self' https://*.vercel.app https://*.onrender.com https://fonts.googleapis.com https://fonts.gstatic.com; "
            "frame-ancestors 'none'"
        )
        if settings.ENVIRONMENT in ("demo", "production"):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject oversized request bodies before parsing payloads."""

    async def dispatch(self, request: Request, call_next: Any) -> Response:
        """Reject requests whose content length or body exceeds MAX_REQUEST_BODY_BYTES."""
        content_length = request.headers.get("content-length")
        if (
            content_length
            and content_length.isdigit()
            and int(content_length) > settings.MAX_REQUEST_BODY_BYTES
        ):
            return JSONResponse(
                status_code=413,
                content={"detail": "Request payload exceeds 1 MB maximum limit."},
            )
        body = await request.body()
        if len(body) > settings.MAX_REQUEST_BODY_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request payload exceeds 1 MB maximum limit."},
            )
        response: Response = await call_next(request)
        return response


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage pooled HTTP client lifecycle and optional demo seeding."""
    http_client = httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=4.0))
    fastapi_app.state.http_client = http_client
    air_data_service.set_http_client(http_client)

    if settings.ENVIRONMENT in ("development", "demo"):
        await seed_database()
    try:
        yield
    finally:
        air_data_service.set_http_client(None)
        fastapi_app.state.http_client = None
        await http_client.aclose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Atmospheric Intelligence and Urban Air Quality Assistant API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.state.http_client = None
app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
app.add_exception_handler(BreatheIQError, _domain_error_handler)

app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_origin_regex=r"^https://.*\.vercel\.app$",
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

app.include_router(health.router)

API_V1_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(air_quality.router, prefix=API_V1_PREFIX)
app.include_router(engines.router, prefix=API_V1_PREFIX)
app.include_router(copilot.router, prefix=API_V1_PREFIX)
app.include_router(user_flow.router, prefix=API_V1_PREFIX)
app.include_router(community.router, prefix=API_V1_PREFIX)
app.include_router(admin.router, prefix=API_V1_PREFIX)

FRONTEND_DIST = os.environ.get("FRONTEND_DIST") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)
if not os.path.exists(FRONTEND_DIST):
    FRONTEND_DIST = "/app/frontend/dist"

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> Response:
        """Serve built SPA entry point and static assets while keeping /api 404s JSON."""
        if full_path.startswith(("api/", "docs", "redoc")) or full_path in ("healthz", "readyz"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend assets not found"})
