"""FastAPI composition for TrackFlow operational APIs."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.app.routers.incidents import router as incidents_router
from services.api.routes.suppliers import router as suppliers_router
from services.api.seed import seed_suppliers


DEFAULT_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


def _allowed_origins() -> list[str]:
    configured = os.getenv("TRACKFLOW_CORS_ORIGINS", "")
    origins = [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    return origins or list(DEFAULT_ORIGINS)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    seed_suppliers()
    yield


app = FastAPI(title="TrackFlow Operations API", version="1.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)
app.include_router(incidents_router)
app.include_router(suppliers_router)
