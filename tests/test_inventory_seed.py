"""Explicit seed preserves existing inventory and requires a real TinyDB identity."""
import pytest
from sqlmodel import SQLModel, Session, create_engine, select
from services.api.inventory_models import SKU, StockEntry, StockExit
from services.api.inventory_seed import seed_inventory


def test_seed_idempotent_and_attributed(user_factory):
    user = user_factory()
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        with pytest.raises(ValueError):
            seed_inventory(session, "not-an-existing-user")
        assert session.exec(select(SKU)).all() == []
        seed_inventory(session, user.id)
        products = session.exec(select(SKU)).all()
        entries = session.exec(select(StockEntry)).all()
        exits = session.exec(select(StockExit)).all()
        assert len(products) == 6 and len(entries) == 7 and len(exits) == 3
        assert {p.sku for p in products} == {"CLT-SNK-W-42", "CLT-SNK-W-42-Z", "TEC-EAR-001", "CSM-SRM-030", "CLT-CHN-N-32", "TEC-CHG-065"}
        assert {e.warehouse for e in entries} == {"LA", "ZGZ"}
        assert {e.exit_type for e in exits} == {"dispatch", "loss"}
        assert {e.user_uuid for e in entries + exits} == {user.id}
        repeated_entries = [e for e in entries if sum(other.sku_id == e.sku_id for other in entries) > 1]
        assert len({e.quantity for e in repeated_entries}) >= 2
        assert all(e.quantity > 0 for e in repeated_entries)
        for p in products:
            assert sum(e.quantity for e in entries if e.sku_id == p.id) >= sum(e.quantity for e in exits if e.sku_id == p.id)
        original = [(e.id, e.quantity, e.created_at) for e in entries]
        seed_inventory(session, user.id)
        assert len(session.exec(select(SKU)).all()) == 6
        assert [(e.id, e.quantity, e.created_at) for e in session.exec(select(StockEntry)).all()] == original
        assert len(session.exec(select(StockExit)).all()) == len(exits)
    engine.dispose()
