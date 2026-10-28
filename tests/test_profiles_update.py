"""Contact updates distinguish omission from null without identity authority."""
import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from tinydb import Query

from services.api.auth import create_access_token
from services.api.auth_database import get_profile_by_user_id, get_user_by_id, open_database
from services.api.auth_dependencies import get_current_user
from services.api.auth_models import ProfileUpdate, Role
from services.api.routes.profiles import edit_profile


@pytest.mark.parametrize("role", list(Role))
def test_update_own_contacts_preserves_identity_and_unrelated_profile(user_factory, role):
    owner = user_factory(role=role, name="Original", phone="123", address="Old address")
    other = user_factory(name="Other")
    other_profile = get_profile_by_user_id(other.id)
    original = get_profile_by_user_id(owner.id)
    resolved = get_current_user(create_access_token(owner.id))
    result = edit_profile(ProfileUpdate(name="Updated", address="New address"), resolved)
    assert result == get_profile_by_user_id(owner.id)
    assert (result.name, result.phone, result.address) == ("Updated", "123", "New address")
    assert (result.id, result.user_id) == (original.id, owner.id)
    cleared = edit_profile(ProfileUpdate(name=None, phone=None, address=None), resolved)
    assert cleared == get_profile_by_user_id(owner.id)
    assert (cleared.name, cleared.phone, cleared.address) == (None, None, None)
    assert get_user_by_id(owner.id) == owner
    assert get_profile_by_user_id(other.id) == other_profile


def test_empty_profile_update_is_stable(user_factory, database_paths):
    owner = get_current_user(create_access_token(user_factory(name="Original", phone="123").id))
    original = get_profile_by_user_id(owner.id)
    before = database_paths.users.read_bytes()
    assert edit_profile(ProfileUpdate(), owner) == original
    assert database_paths.users.read_bytes() == before


@pytest.mark.parametrize("payload", [{"id": "chosen"}, {"user_id": "other"}, {"role": "admin"}, {"email": "other@example.test"}, {"password": "replacement"}, {"is_active": False}, {"unknown": True}, {"phone": 123}])
def test_invalid_profile_update_cannot_partially_apply(user_factory, database_paths, payload):
    owner = user_factory(name="Original")
    before = database_paths.users.read_bytes()
    with pytest.raises(ValidationError):
        edit_profile(ProfileUpdate(**({"name": "Should not persist"} | payload)), owner)
    assert database_paths.users.read_bytes() == before


def test_profile_update_missing_link_fails_without_identity_mutation(user_factory, database_paths):
    owner = user_factory()
    with open_database() as db:
        db.table("profiles").remove(Query().user_id == owner.id)
    before = database_paths.users.read_bytes()
    with pytest.raises(HTTPException) as error:
        edit_profile(ProfileUpdate(name="Replacement"), get_current_user(create_access_token(owner.id)))
    assert (error.value.status_code, error.value.detail) == (500, "User profile unavailable")
    assert database_paths.users.read_bytes() == before
