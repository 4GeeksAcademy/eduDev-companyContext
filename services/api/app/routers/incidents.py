"""HTTP endpoints for aggregate-only incident analysis."""

from __future__ import annotations

import io
from typing import Annotated, Any

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from shared.incident_analysis import (
    EmptyCSVError,
    InvalidHeaderError,
    MalformedCSVError,
    analyze_csv_bytes,
    results_to_csv,
)


router = APIRouter(prefix="/api/incidents", tags=["incidents"])
_last_result: dict[str, Any] | None = None


@router.post("/analyze")
async def analyze_incidents(
    file: Annotated[UploadFile | None, File()] = None,
) -> dict[str, Any]:
    """Analyze one uploaded CSV without persisting its source content."""
    if file is None:
        raise HTTPException(status_code=400, detail="A CSV file is required.")
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="The uploaded file must have a .csv extension.")
    if file.content_type not in {"text/csv", "application/csv", "application/vnd.ms-excel"}:
        raise HTTPException(status_code=415, detail="The uploaded file must use a CSV content type.")

    raw_content = await file.read()
    await file.close()
    try:
        summary = analyze_csv_bytes(raw_content)
    except EmptyCSVError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except UnicodeDecodeError as error:
        raise HTTPException(status_code=422, detail="The CSV file must use valid UTF-8 encoding.") from error
    except (InvalidHeaderError, MalformedCSVError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    global _last_result
    _last_result = summary
    return summary


@router.get("/results/export")
def export_results() -> StreamingResponse:
    """Download the most recent successful aggregate analysis."""
    if _last_result is None:
        raise HTTPException(status_code=404, detail="No successful incident analysis is available.")

    content = results_to_csv(_last_result)
    return StreamingResponse(
        io.StringIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="results.csv"'},
    )
