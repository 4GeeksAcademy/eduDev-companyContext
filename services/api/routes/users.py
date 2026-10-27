"""Public registration and narrowly authorized identity CRUD."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response

from services.api.auth_database import (
    DuplicateEmailError, create_user, delete_user, get_user_by_id, list_users, update_user,
)
from services.api.auth_dependencies import SensitiveInputRoute, get_current_user
from services.api.auth_models import RegistrationInput, Role, User, UserResponse, UserUpdate


router = APIRouter(prefix="/users", tags=["users"], route_class=SensitiveInputRoute)
CurrentUser = Annotated[User, Depends(get_current_user)]


def require_owner_or_admin(user: User, user_id: str):
    if user.id != user_id and user.role != Role.admin:
        raise HTTPException(403, "Forbidden")


@router.post("", response_model=UserResponse, status_code=201)
def register(data: RegistrationInput):
    try:
        return create_user(data)
    except DuplicateEmailError:
        raise HTTPException(status_code=409, detail="Email already registered") from None


@router.get("", response_model=list[UserResponse])
def directory(user: CurrentUser):
    if user.role != Role.admin:
        raise HTTPException(403, "Forbidden")
    return list_users()


@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: str, user: CurrentUser):
    require_owner_or_admin(user, user_id)
    result = get_user_by_id(user_id)
    if result is None:
        raise HTTPException(404, "User not found")
    return result


@router.put("/{user_id}", response_model=UserResponse)
def edit_user(user_id: str, data: UserUpdate, user: CurrentUser):
    require_owner_or_admin(user, user_id)
    if "role" in data.model_fields_set and user.role != Role.admin:
        raise HTTPException(403, "Only admins may set roles")
    try:
        result = update_user(user_id, data)
    except DuplicateEmailError:
        raise HTTPException(409, "Email already registered") from None
    if result is None:
        raise HTTPException(404, "User not found")
    return result


@router.delete("/{user_id}", status_code=204)
def remove_user(user_id: str, user: CurrentUser):
    require_owner_or_admin(user, user_id)
    if not delete_user(user_id):
        raise HTTPException(404, "User not found")
    return Response(status_code=204)
