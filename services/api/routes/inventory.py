"""Authenticated internal inventory; each movement is one database transaction."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from services.api.auth_dependencies import get_current_user
from services.api.auth_models import User
from services.api.inventory_database import get_inventory_session
from services.api.inventory_models import SKU, StockEntry, StockExit
from services.api.inventory_schemas import (
    ProductCreate, ProductResponse, EntryCreate, ExitCreate, EntryResponse, ExitResponse,
)

router = APIRouter(prefix="/inventory", tags=["inventory"], dependencies=[Depends(get_current_user)])


def stock(session: Session, product: SKU) -> int:
    totals = []
    for model in (StockEntry, StockExit):
        totals.append(session.exec(select(func.coalesce(func.sum(model.quantity), 0)).where(
            model.sku_id == product.id, model.warehouse == product.warehouse)).one())
    return int(totals[0] - totals[1])


def find_product(session: Session, sku_id: int, *, lock=False) -> SKU:
    query = select(SKU).where(SKU.id == sku_id)
    if lock:
        query = query.with_for_update()
    product = session.exec(query).first()
    if product is None:
        raise HTTPException(404, "SKU not found.")
    return product


def product_response(product, available):
    return ProductResponse(**product.model_dump(), current_stock=available)


def movement_response(movement, product):
    schema = EntryResponse if isinstance(movement, StockEntry) else ExitResponse
    return schema(**movement.model_dump(), name=product.name, sku=product.sku,
                  client_name=product.client_name, category=product.category)


@router.post("/products", response_model=ProductResponse, status_code=201)
def create_product(data: ProductCreate, session: Session = Depends(get_inventory_session)):
    product = SKU(**data.model_dump())
    try:
        session.add(product)
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(409, "SKU already exists.") from None
    session.refresh(product)
    return product_response(product, 0)


@router.get("/products", response_model=list[ProductResponse])
def list_products(session: Session = Depends(get_inventory_session)):
    # Preaggregate each movement table to avoid joined-row multiplication and N+1.
    aggregates = []
    for model in (StockEntry, StockExit):
        aggregates.append(select(model.sku_id, model.warehouse, func.sum(model.quantity).label("total"))
                          .group_by(model.sku_id, model.warehouse).subquery())
    inbound, outbound = aggregates
    query = select(SKU, (func.coalesce(inbound.c.total, 0) - func.coalesce(outbound.c.total, 0)))
    for aggregate in aggregates:
        query = query.outerjoin(aggregate, (aggregate.c.sku_id == SKU.id) & (aggregate.c.warehouse == SKU.warehouse))
    return [product_response(product, int(total)) for product, total in session.exec(query.order_by(SKU.id)).all()]


@router.get("/products/{id}", response_model=ProductResponse)
def get_product(id: int, session: Session = Depends(get_inventory_session)):
    product = find_product(session, id)
    return product_response(product, stock(session, product))


def record_movement(session, data, user_uuid):
    # No earlier SQL on this session: SELECT FOR UPDATE and stock/write share begin.
    with session.begin():
        product = find_product(session, data.sku_id, lock=True)
        if product.warehouse != data.warehouse:
            raise HTTPException(400, "Warehouse must match SKU warehouse.")
        if isinstance(data, ExitCreate):
            available = stock(session, product)
            if data.quantity > available:
                raise HTTPException(400, f"Insufficient stock for SKU '{product.sku}'. Available: {available}, requested: {data.quantity}.")
            model = StockExit
        else:
            model = StockEntry
        movement = model(**data.model_dump(), user_uuid=user_uuid)
        session.add(movement)
        session.flush()
        response = movement_response(movement, product)
    return response


@router.post("/orders/inbound", response_model=EntryResponse, status_code=201)
def inbound(data: EntryCreate, session: Session = Depends(get_inventory_session), user: User = Depends(get_current_user)):
    return record_movement(session, data, user.id)


@router.post("/orders/outbound", response_model=ExitResponse, status_code=201)
def outbound(data: ExitCreate, session: Session = Depends(get_inventory_session), user: User = Depends(get_current_user)):
    return record_movement(session, data, user.id)


@router.get("/orders", response_model=list[EntryResponse | ExitResponse])
def orders(session: Session = Depends(get_inventory_session)):
    results = []
    for model in (StockEntry, StockExit):
        results.extend(movement_response(movement, product) for movement, product in
                       session.exec(select(model, SKU).join(SKU, model.sku_id == SKU.id)).all())
    return sorted(results, key=lambda row: (row.created_at, row.id), reverse=True)
