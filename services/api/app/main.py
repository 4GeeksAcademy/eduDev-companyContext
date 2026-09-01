"""FastAPI composition for the TrackFlow incident analyzer."""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.api.app.routers.incidents import router as incidents_router


DEFAULT_ORIGINS = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)


def _allowed_origins() -> list[str]:
    configured = os.getenv("TRACKFLOW_CORS_ORIGINS", "")
    origins = [origin.strip().rstrip("/") for origin in configured.split(",") if origin.strip()]
    return origins or list(DEFAULT_ORIGINS)


app = FastAPI(title="TrackFlow Incident Analyzer", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(incidents_router)
