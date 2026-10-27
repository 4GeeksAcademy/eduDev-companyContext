"""Public registration only; authentication and user CRUD arrive separately."""

from fastapi import APIRouter, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.routing import APIRoute
from starlette.responses import JSONResponse

from services.api.auth_database import DuplicateEmailError, create_user
from services.api.auth_models import RegistrationInput, UserResponse


class RegistrationRoute(APIRoute):
    """Do not echo submitted credentials in FastAPI validation responses."""

    def get_route_handler(self):
        handler = super().get_route_handler()

        async def safe_handler(request):
            try:
                return await handler(request)
            except RequestValidationError as error:
                return JSONResponse(status_code=422, content={"detail": [
                    {"loc": list(item["loc"]), "type": item["type"],
                     "msg": "Invalid registration field"}
                    for item in error.errors()
                ]})

        return safe_handler


router = APIRouter(prefix="/users", tags=["users"], route_class=RegistrationRoute)


@router.post("", response_model=UserResponse, status_code=201)
def register(data: RegistrationInput):
    try:
        return create_user(data)
    except DuplicateEmailError:
        raise HTTPException(status_code=409, detail="Email already registered") from None
