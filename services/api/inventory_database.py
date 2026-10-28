"""Lazy PostgreSQL-only runtime configuration, never a test-storage fallback."""
import os
from functools import lru_cache

from fastapi import HTTPException
from sqlalchemy.engine import make_url
from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, SQLModel, create_engine

from services.api import inventory_models  # register metadata before initialization


@lru_cache(maxsize=1)
def _engine(url: str):
    parsed = make_url(url)
    if parsed.drivername not in {"postgres", "postgresql", "postgresql+psycopg2"}:
        raise ValueError("PostgreSQL required")
    parsed = parsed.set(drivername="postgresql+psycopg2")
    return create_engine(parsed, pool_pre_ping=True, connect_args={"connect_timeout": 5})


def configured_engine():
    url = os.getenv("DATABASE_URL", "").strip()
    if not url:
        raise ValueError("Inventory not configured")
    return _engine(url)


def initialize_inventory():
    """Development create_all only, no seeding; old routes survive unavailable SQL."""
    if not os.getenv("DATABASE_URL", "").strip():
        return
    try:
        SQLModel.metadata.create_all(configured_engine())
    except (ValueError, SQLAlchemyError):
        pass  # Do not log URLs, credentials or driver diagnostics.


def get_inventory_session():
    try:
        engine = configured_engine()
        with Session(engine) as session:
            yield session
    except (ValueError, SQLAlchemyError):
        raise HTTPException(503, "Inventory service unavailable.") from None
