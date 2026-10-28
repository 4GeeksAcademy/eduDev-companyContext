"""FastAPI composition for TrackFlow operational APIs."""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from services.api.app.routers.incidents import router as incidents_router
from services.api.app.routers.incident_management import router as incident_management_router
from services.api.routes.suppliers import router as suppliers_router
from services.api.routes.users import router as users_router
from services.api.routes.auth import router as auth_router
from services.api.routes.profiles import router as profiles_router
from services.api.seed import seed_suppliers
from services.api.auth_dependencies import get_current_user
from services.api.database import StorageError


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


@app.exception_handler(StorageError)
@app.exception_handler(Exception)
async def service_failure(_: Request, __: Exception) -> JSONResponse:
    """Last resort only; HTTP/domain handlers retain their existing contracts."""
    return JSONResponse(status_code=500, content={"detail": "Service unavailable."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "PUT"],
    allow_headers=["Content-Type", "Authorization"],
)
app.include_router(incidents_router, dependencies=[Depends(get_current_user)])
app.include_router(incident_management_router, dependencies=[Depends(get_current_user)])
app.include_router(suppliers_router, dependencies=[Depends(get_current_user)])
app.include_router(users_router)
app.include_router(auth_router)
app.include_router(profiles_router)
