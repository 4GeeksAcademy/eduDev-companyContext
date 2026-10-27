"""Separate identity, profile and public registration schemas."""

import re
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, SecretStr, field_validator


def normalize_email(value: str) -> str:
    return value.strip().lower()


class Role(str, Enum):
    admin = "admin"
    manager = "manager"
    user = "user"


class Profile(BaseModel):
    id: str
    user_id: str
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    role: Role
    created_at: datetime


class User(UserResponse):
    hashed_password: str = Field(repr=False)


class RegistrationInput(BaseModel):
    model_config = ConfigDict(extra="forbid", hide_input_in_errors=True)

    email: str
    password: SecretStr
    name: str | None = None
    phone: str | None = None
    address: str | None = None

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        value = normalize_email(value)
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Invalid email")
        return value

    @field_validator("password")
    @classmethod
    def valid_password(cls, value: SecretStr) -> SecretStr:
        size = len(value.get_secret_value().encode("utf-8"))
        if not 1 <= size <= 72:
            raise ValueError("Password must contain 1 to 72 UTF-8 bytes")
        return value
