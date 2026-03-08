import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api import auth, dashboard, dimensions, judge, models, runs, scores, settings, tasks
from app.api.auth import get_current_user
from app.config import settings as app_settings
from app.database import engine
from app.models.base import Base

logger = logging.getLogger(__name__)


async def _run_migrations(conn) -> None:  # type: ignore[no-untyped-def]
    """Add columns / constraints that create_all cannot add to existing tables."""
    insp = inspect(conn)

    # --- scores.dimension_id ---------------------------------------------------
    if insp.has_table("scores"):
        cols = {c["name"] for c in insp.get_columns("scores")}
        if "dimension_id" not in cols:
            logger.info("Migration: adding scores.dimension_id column")
            conn.execute(
                text(
                    "ALTER TABLE scores ADD COLUMN dimension_id VARCHAR(36) "
                    "REFERENCES dimensions(id)"
                )
            )

    # --- task_model_assignments unique constraint ------------------------------
    if insp.has_table("task_model_assignments"):
        uqs = insp.get_unique_constraints("task_model_assignments")
        has_uq = any(
            set(uq["column_names"]) == {"task_id", "model_id"} for uq in uqs
        )
        if not has_uq:
            logger.info(
                "Migration: adding unique constraint on "
                "task_model_assignments(task_id, model_id)"
            )
            conn.execute(
                text(
                    "ALTER TABLE task_model_assignments "
                    "ADD CONSTRAINT uq_task_model_assignments_task_id_model_id "
                    "UNIQUE (task_id, model_id)"
                )
            )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Apply incremental migrations for columns added after initial schema
        await conn.run_sync(_run_migrations)
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
    allow_origins=app_settings.cors_origins,
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
app.include_router(settings.router, dependencies=[Depends(get_current_user)])
app.include_router(judge.router, dependencies=[Depends(get_current_user)])
