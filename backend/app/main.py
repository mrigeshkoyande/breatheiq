from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.seed import seed_database
from app.api.v1.endpoints import auth, health, air_quality, engines

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

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers (Mounted under /api/v1 and aliased to /api for client compatibility)
app.include_router(health.router)

for prefix in ["/api/v1", "/api"]:
    app.include_router(auth.router, prefix=prefix)
    app.include_router(air_quality.router, prefix=prefix)
    app.include_router(engines.router, prefix=prefix)
