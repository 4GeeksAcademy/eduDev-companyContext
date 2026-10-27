"""Owner-only profile access; identity is always resolved from the bearer token."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from services.api.auth_database import get_profile_by_user_id, update_profile
from services.api.auth_dependencies import SensitiveInputRoute, get_current_user
from services.api.auth_models import Profile, ProfileUpdate, User


router = APIRouter(prefix="/profiles", tags=["profiles"], route_class=SensitiveInputRoute)
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("/me", response_model=Profile)
def read_profile(user: CurrentUser):
    profile = get_profile_by_user_id(user.id)
    if profile is None:
        raise HTTPException(500, "User profile unavailable")
    return profile


@router.put("/me", response_model=Profile)
def edit_profile(data: ProfileUpdate, user: CurrentUser):
    profile = update_profile(user.id, data)
    if profile is None:
        raise HTTPException(500, "User profile unavailable")
    return profile
