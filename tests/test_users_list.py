"""Only a resolved administrator may read the identity directory."""
import pytest
from fastapi import HTTPException

from services.api.auth import create_access_token
from services.api.auth_database import delete_user, set_password_reset
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import Role, UserResponse
from services.api.routes.users import directory


def test_admin_directory_contains_real_identities_and_safe_schema(user_factory, database_paths):
    admin = user_factory(role=Role.admin)
    other = user_factory(role=Role.manager)
    set_password_reset(other.id, "pending-test-reset")
    before = database_paths.users.read_bytes()
    result = directory(get_current_user(create_access_token(admin.id)))
    assert {user.id for user in result} == {admin.id, other.id}
    assert {user.role for user in result} == {Role.admin, Role.manager}
    for user in result:
        assert set(UserResponse.model_validate(user.model_dump()).model_dump()) == {"id", "email", "role", "is_active", "created_at"}
    assert database_paths.users.read_bytes() == before


def test_directory_empty_store_with_explicit_admin_dependency(user_factory):
    # A direct route unit can supply a resolved identity independently of storage.
    admin = user_factory(role=Role.admin)
    delete_user(admin.id)
    assert directory(admin) == []


@pytest.mark.parametrize("role", [Role.user, Role.manager])
def test_nonadmin_directory_refused_without_mutation(user_factory, database_paths, role):
    user = user_factory(role=role)
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        directory(get_current_user(create_access_token(user.id)))
    assert (error.value.status_code, error.value.detail) == (403, "Forbidden")
    assert database_paths.users.read_bytes() == before
