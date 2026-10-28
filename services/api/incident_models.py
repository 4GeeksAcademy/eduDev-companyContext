"""Pydantic incident schemas; shared rules remain standard-library only."""
from datetime import datetime
from typing import Annotated
from uuid import uuid4

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

from packages.shared.incidents import (
    IncidentBranch, IncidentCategory, IncidentOrigin, IncidentStatus,
    normalize_utc, utc_now, validate_nonblank,
)

NonBlankText = Annotated[str, AfterValidator(validate_nonblank)]
UTCTimestamp = Annotated[datetime, AfterValidator(normalize_utc)]


class IncidentCreate(BaseModel):
    """Registration input; generated fields are deliberately excluded."""
    model_config = ConfigDict(extra="forbid")

    title: NonBlankText
    description: NonBlankText
    category: IncidentCategory
    status: IncidentStatus = IncidentStatus.OPEN
    origin: IncidentOrigin
    branch: IncidentBranch


class Incident(IncidentCreate):
    """Stored/response contract with ordinary UUID and UTC defaults."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: UTCTimestamp = Field(default_factory=utc_now)
    updated_at: UTCTimestamp = Field(default_factory=utc_now)


class IncidentStatusUpdate(BaseModel):
    """The lifecycle service must validate the edge against the stored status."""
    model_config = ConfigDict(extra="forbid")

    status: IncidentStatus
