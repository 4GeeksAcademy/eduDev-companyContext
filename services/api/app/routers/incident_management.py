"""Authenticated manager routes with local, value-free error responses."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from pydantic import BaseModel, ConfigDict
from starlette.exceptions import HTTPException as StarletteHTTPException

from packages.shared.incidents import (
    IncidentStatus, IncidentCategory, IncidentOrigin, IncidentBranch,
    InvalidStatusTransitionError,
)
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import User
from services.api.incident_models import IncidentResponse, IncidentCreate, IncidentStatusUpdate
from services.api.incident_store import (
    create_incident, list_incidents, get_incident, update_incident_status, cached_incident_read,
)


def validation_response(exc: RequestValidationError) -> JSONResponse:
    errors = {}
    messages = {
        "missing": "This field is required.",
        "extra_forbidden": "This field is not allowed.",
        "enum": "Choose a supported value.",
        "string_type": "Enter text.",
        "value_error": "Must not be blank.",
        "json_invalid": "Send a valid JSON object.",
    }
    for error in exc.errors():
        location = error.get("loc", ())
        # JSON parser locations contain offsets, not field names.
        field = (str(location[1]) if len(location) > 1 and isinstance(location[1], str)
                 else "body")
        errors[field] = messages.get(error["type"], "Send a valid value.")
    return JSONResponse(status_code=400, content={"detail": "Invalid incident request.", "errors": errors})


class IncidentRoute(APIRoute):
    def get_route_handler(self):
        handler = super().get_route_handler()

        async def safe_handler(request: Request):
            try:
                return await handler(request)
            except RequestValidationError as exc:
                return validation_response(exc)
            except StarletteHTTPException:
                raise
            except Exception:
                # Includes corrupt storage and response validation, not lifecycle errors.
                return JSONResponse(status_code=500, content={"detail": "Incident service unavailable."})

        return safe_handler


router = APIRouter(prefix="/api/incidents", tags=["Incident management"], route_class=IncidentRoute)


class IncidentFilters(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: IncidentStatus | None = None
    origin: IncidentOrigin | None = None
    branch: IncidentBranch | None = None
    category: IncidentCategory | None = None


class IncidentSummary(BaseModel):
    total: int
    by_status: dict[IncidentStatus, int]
    by_category: dict[IncidentCategory, int]
    by_origin: dict[IncidentOrigin, int]
    by_branch: dict[IncidentBranch, int]


@router.post("", status_code=201, response_model=IncidentResponse)
def register_incident(payload: IncidentCreate):
    return create_incident(payload)


def find_incidents(filters: Annotated[IncidentFilters, Query()]):
    selected = filters.model_dump(exclude_none=True)
    return [record for record in list_incidents()
            if all(getattr(record, key) == value for key, value in selected.items())]


def summarize_incidents():
    records = list_incidents()
    summary = {"total": len(records)}
    for field, enum in (("status", IncidentStatus), ("category", IncidentCategory),
                        ("origin", IncidentOrigin), ("branch", IncidentBranch)):
        counts = {value.value: 0 for value in enum}
        for record in records:
            counts[getattr(record, field)] += 1
        summary["by_" + field] = counts
    return summary


@router.get("", response_model=list[IncidentResponse],
            name="find_incidents")
def cached_find_incidents(filters: Annotated[IncidentFilters, Query()],
                          user: Annotated[User, Depends(get_current_user)]):
    selected = tuple(sorted(filters.model_dump(mode="json", exclude_none=True).items()))
    return cached_incident_read(user.id, "list", selected, lambda: [
        IncidentResponse.model_validate(record.model_dump()) for record in find_incidents(filters)
    ])


@router.get("/summary", response_model=IncidentSummary,
            name="summarize_incidents")
def cached_summarize_incidents(user: Annotated[User, Depends(get_current_user)]):
    return cached_incident_read(user.id, "summary", (), lambda:
                               IncidentSummary.model_validate(summarize_incidents()))


@router.get("/{incident_id}", response_model=IncidentResponse)
def read_incident(incident_id: str):
    record = get_incident(incident_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return record


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def change_status(incident_id: str, payload: IncidentStatusUpdate):
    try:
        record = update_incident_status(incident_id, payload.status)
    except InvalidStatusTransitionError:
        return JSONResponse(status_code=400, content={
            "detail": "Invalid incident request.",
            "errors": {"status": "This status transition is not allowed."},
        })
    if record is None:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return record
