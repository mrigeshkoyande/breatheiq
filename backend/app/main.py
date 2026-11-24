import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings
from app.db.seed import seed_database
from app.api.v1.endpoints import auth, health, air_quality, engines, copilot, user_flow, community, admin

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=()"
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.ENVIRONMENT != "testing":
        await seed_database()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Atmospheric Intelligence and Urban Air Quality Assistant API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Security and CORS Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers (Mounted under canonical /api/v1 prefix)
app.include_router(health.router)

API_V1_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(air_quality.router, prefix=API_V1_PREFIX)
app.include_router(engines.router, prefix=API_V1_PREFIX)
app.include_router(copilot.router, prefix=API_V1_PREFIX)
app.include_router(user_flow.router, prefix=API_V1_PREFIX)
app.include_router(community.router, prefix=API_V1_PREFIX)
app.include_router(admin.router, prefix=API_V1_PREFIX)

# SPA Static File Serving for single-origin container deployment
FRONTEND_DIST = os.environ.get("FRONTEND_DIST") or os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if not os.path.exists(FRONTEND_DIST):
    FRONTEND_DIST = "/app/frontend/dist"

if os.path.exists(FRONTEND_DIST) and (os.environ.get("SERVE_FRONTEND", "").lower() == "true" or settings.ENVIRONMENT == "production"):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path == "healthz":
            return {"detail": "Not Found"}
        candidate = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return {"detail": "Frontend assets not found"}

