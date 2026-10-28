"""Form login and safe authenticated identity endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Form, HTTPException

from services.api.auth import (
    AuthConfigurationError, create_access_token, create_reset_token,
    decode_reset_token, verify_password,
)
from services.api.email_delivery import delivery_configuration, send_password_reset
from services.api.auth_database import (
    change_password, consume_password_reset, get_profile_by_user_id,
    get_user_by_email, set_password_reset,
)
from services.api.auth_dependencies import SensitiveInputRoute, get_current_user, unauthorized
from services.api.auth_models import (
    ChangePasswordInput, CurrentUserResponse, ForgotPasswordInput, ResetPasswordInput,
    TokenResponse, User, normalize_email,
)


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


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordInput):
    # Provider/configuration failures deliberately share the unknown-account result.
    try:
        configuration = delivery_configuration()
        user = get_user_by_email(data.email)
        if user is not None and user.is_active:
            token, reset_id = create_reset_token(user.id)
            if set_password_reset(user.id, reset_id):
                send_password_reset(user.email, token, configuration)
    except (AuthConfigurationError, OSError, ValueError):
        pass
    return {"message": "If the account exists, a password reset link will be sent."}


@router.post("/reset-password")
def reset_password(data: ResetPasswordInput):
    try:
        claims = decode_reset_token(data.token.get_secret_value())
        consumed = consume_password_reset(
            claims["sub"], claims["jti"], data.new_password.get_secret_value())
    except AuthConfigurationError:
        raise
    except ValueError:
        consumed = False
    if not consumed:
        raise HTTPException(400, "Invalid or expired reset token")
    return {"message": "Password reset successfully."}


@router.post("/change-password")
def change_own_password(data: ChangePasswordInput, user: Annotated[User, Depends(get_current_user)]):
    try:
        changed = change_password(
            user.id, data.current_password.get_secret_value(), data.new_password.get_secret_value())
    except ValueError:
        raise HTTPException(422, "Invalid authentication input") from None
    if not changed:
        raise HTTPException(400, "Current password is incorrect")
    return {"message": "Password changed successfully."}


@router.get("/me", response_model=CurrentUserResponse)
def current_user(user: Annotated[User, Depends(get_current_user)]):
    profile = get_profile_by_user_id(user.id)
    if profile is None:
        raise HTTPException(500, "User profile unavailable")
    return CurrentUserResponse(**user.model_dump(exclude={"hashed_password"}), profile=profile)
