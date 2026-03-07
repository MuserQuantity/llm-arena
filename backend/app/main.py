from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, dimensions, models, runs, scores, tasks
from app.api.auth import get_current_user
from app.config import settings
from app.database import engine
from app.models.base import Base


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="LLM Arena API",
    description="Internal LLM evaluation platform API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public routes (no auth)
app.include_router(auth.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


# Protected routes (require auth)
app.include_router(models.router, dependencies=[Depends(get_current_user)])
app.include_router(dimensions.router, dependencies=[Depends(get_current_user)])
app.include_router(tasks.router, dependencies=[Depends(get_current_user)])
app.include_router(runs.router, dependencies=[Depends(get_current_user)])
app.include_router(scores.router, dependencies=[Depends(get_current_user)])
app.include_router(dashboard.router, dependencies=[Depends(get_current_user)])
