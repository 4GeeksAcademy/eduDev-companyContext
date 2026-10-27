"""Form login and safe authenticated identity endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException

from services.api.auth import create_access_token, verify_password
from services.api.auth_database import get_profile_by_user_id, get_user_by_email
from services.api.auth_dependencies import SensitiveInputRoute, get_current_user, unauthorized
from services.api.auth_models import CurrentUserResponse, TokenResponse, User, normalize_email


router = APIRouter(prefix="/auth", tags=["auth"], route_class=SensitiveInputRoute)


@router.post("/login", response_model=TokenResponse)
def login(
    password: Annotated[str, Form()],
    email: Annotated[str | None, Form()] = None,
    username: Annotated[str | None, Form()] = None,
):
    """Submit form email/password, or OAuth username (email)/password."""
    if not (email or username) or (
        email is not None and username is not None
        and normalize_email(email) != normalize_email(username)
    ):
        raise HTTPException(422, "Invalid authentication input")
    user = get_user_by_email(email or username)
    if user is None or not verify_password(password, user.hashed_password) or not user.is_active:
        raise unauthorized("Invalid credentials")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=CurrentUserResponse)
def current_user(user: Annotated[User, Depends(get_current_user)]):
    profile = get_profile_by_user_id(user.id)
    if profile is None:
        raise HTTPException(500, "User profile unavailable")
    return CurrentUserResponse(**user.model_dump(exclude={"hashed_password"}), profile=profile)
