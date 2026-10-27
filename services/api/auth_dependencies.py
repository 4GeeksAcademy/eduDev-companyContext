"""Reusable bearer authentication without storage/password import cycles."""

import math
from uuid import UUID

from fastapi import Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from services.api.auth import AuthConfigurationError, token_configuration
from services.api.auth_database import get_user_by_id
from services.api.auth_models import User


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def unauthorized(detail: str = "Invalid authentication credentials") -> HTTPException:
    return HTTPException(401, detail, headers={"WWW-Authenticate": "Bearer"})


class SensitiveInputRoute(APIRoute):
    """Keep submitted credentials out of FastAPI validation responses."""

    def get_route_handler(self):
        handler = super().get_route_handler()

        async def sanitized_handler(request: Request):
            try:
                return await handler(request)
            except RequestValidationError:
                raise HTTPException(422, "Invalid authentication input") from None
            except AuthConfigurationError:
                raise HTTPException(503, "Authentication configuration unavailable") from None

        return sanitized_handler


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        secret, _ = token_configuration()
    except AuthConfigurationError:
        raise HTTPException(503, "Authentication configuration unavailable") from None
    try:
        claims = jwt.decode(token, secret, algorithms=["HS256"],
                            options={"require_sub": True, "require_exp": True})
        subject = claims["sub"]
        if not isinstance(subject, str):
            raise ValueError
        UUID(subject)
        expiry = claims["exp"]
        if isinstance(expiry, bool) or not isinstance(expiry, (int, float)) or not math.isfinite(expiry):
            raise ValueError
    except (JWTError, ValueError, TypeError, OverflowError):
        raise unauthorized() from None
    user = get_user_by_id(subject)
    if user is None or not user.is_active:
        raise unauthorized()
    return user
