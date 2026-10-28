"""Explicit, additive demonstration seed. Never runs during API startup."""
import argparse

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from services.api.auth_database import get_user_by_id
from services.api.inventory_database import configured_engine
from services.api.inventory_models import SKU, StockEntry, StockExit
from services.api.inventory_schemas import EntryCreate, ExitCreate
from services.api.routes.inventory import stock

PRODUCTS = [
    ("Classic White Sneaker - Size 42", "CLT-SNK-W-42", "PureStep Footwear", "fashion", "LA"),
    ("Classic White Sneaker - Size 42", "CLT-SNK-W-42-Z", "PureStep Footwear", "fashion", "ZGZ"),
    ("Wireless Earbuds Pro", "TEC-EAR-001", "SoundWave Electronics", "electronics", "LA"),
    ("Hydrating Face Serum 30ml", "CSM-SRM-030", "GlowLab Cosmetics", "cosmetics", "ZGZ"),
    ("Slim Fit Chino - Navy 32/32", "CLT-CHN-N-32", "UrbanThread", "fashion", "LA"),
    ("USB-C Fast Charger 65W", "TEC-CHG-065", "SoundWave Electronics", "electronics", "ZGZ"),
]


def seed_inventory(session: Session, user_uuid: str):
    user = get_user_by_id(user_uuid)
    if user is None or not user.is_active:
        raise ValueError("Existing active identity required")
    try:
        products = []
        for name, sku, client, category, warehouse in PRODUCTS:
            product = session.exec(select(SKU).where(SKU.sku == sku).with_for_update()).first()
            if product is None:
                product = SKU(name=name, sku=sku, client_name=client, category=category, warehouse=warehouse)
                session.add(product)
                session.flush()
            elif (product.name, product.client_name, product.category, product.warehouse) != (name, client, category, warehouse):
                raise ValueError("Existing SKU differs from demo contract")
            products.append(product)
        # Seven entries include a repeat; exits cover both warehouses and types.
        for index, product in enumerate(products + products[:1]):
            key = f"trackflow-demo-entry-v1-{index}"
            if session.exec(select(StockEntry).where(StockEntry.seed_key == key)).first() is None:
                data = EntryCreate(sku_id=product.id, quantity=20, reference=key, warehouse=product.warehouse)
                session.add(StockEntry(**data.model_dump(), seed_key=key, user_uuid=user.id))
        session.flush()
        for index, product in enumerate(products[:3]):
            key = f"trackflow-demo-exit-v1-{index}"
            if session.exec(select(StockExit).where(StockExit.seed_key == key)).first() is None:
                data = ExitCreate(sku_id=product.id, quantity=2, warehouse=product.warehouse,
                                  exit_type="loss" if index == 1 else "dispatch",
                                  tracking_number=None if index == 1 else f"DEMO-{index}")
                if stock(session, product) < data.quantity:
                    raise ValueError("Insufficient demo stock")
                session.add(StockExit(**data.model_dump(), seed_key=key, user_uuid=user.id))
        session.commit()
    except Exception:
        session.rollback()
        raise


def main():
    parser = argparse.ArgumentParser(description="Add TrackFlow demo inventory to the configured development database")
    parser.add_argument("--user-uuid", required=True, help="Existing active TinyDB User.id")
    args = parser.parse_args()
    try:
        with Session(configured_engine()) as session:
            seed_inventory(session, args.user_uuid)
    except (ValueError, SQLAlchemyError):
        parser.exit(1, "Inventory seed unavailable. Check database setup and existing active user attribution.\n")
    print("Inventory demo seed complete; existing records preserved.")


if __name__ == "__main__":
    main()
