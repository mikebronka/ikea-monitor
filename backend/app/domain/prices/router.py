from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domain.prices.models import PriceChange, PriceRecord
from app.domain.products.models import Product
from app.domain.lists.models import ListProduct

router = APIRouter()


@router.get("/history/{product_id}")
async def price_history(
    product_id: int,
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    db: AsyncSession = Depends(get_db),
):
    query = select(PriceRecord).where(PriceRecord.product_id == product_id)
    if from_date:
        query = query.where(PriceRecord.recorded_at >= from_date)
    if to_date:
        query = query.where(PriceRecord.recorded_at <= to_date)
    query = query.order_by(PriceRecord.recorded_at)

    result = await db.execute(query)
    records = result.scalars().all()

    return {
        "product_id": product_id,
        "history": [
            {"date": r.recorded_at.isoformat(), "price": float(r.price), "tags": r.tags}
            for r in records
        ],
    }


@router.get("/changes")
async def price_changes(
    days: int = Query(30, ge=1, le=365),
    direction: str | None = Query(None, pattern="^(drop|rise)$"),
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    since = date.today() - timedelta(days=days)
    query = select(PriceChange).where(PriceChange.detected_at >= since)
    if direction == "drop":
        query = query.where(PriceChange.change_amount < 0)
    elif direction == "rise":
        query = query.where(PriceChange.change_amount > 0)
    query = query.order_by(desc(PriceChange.detected_at))

    result = await db.execute(query)
    changes = result.scalars().all()

    return {
        "changes": [
            {
                "product_id": c.product_id,
                "old_price": float(c.old_price),
                "new_price": float(c.new_price),
                "change_amount": float(c.change_amount),
                "change_pct": float(c.change_pct),
                "detected_at": c.detected_at.isoformat(),
            }
            for c in changes
        ]
    }


@router.get("/summary")
async def price_summary(
    list_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    product_query = select(Product).where(Product.is_active.is_(True))
    if list_id:
        product_ids_q = select(ListProduct.product_id).where(ListProduct.list_id == list_id)
        product_query = product_query.where(Product.id.in_(product_ids_q))

    result = await db.execute(product_query)
    products = result.scalars().all()

    total_ref = sum(float(p.ref_price) for p in products)
    total_current = 0.0
    products_with_price = 0
    promo_count = 0

    for product in products:
        latest = await db.execute(
            select(PriceRecord)
            .where(PriceRecord.product_id == product.id)
            .order_by(PriceRecord.recorded_at.desc())
            .limit(1)
        )
        record = latest.scalar_one_or_none()
        if record:
            total_current += float(record.price)
            products_with_price += 1
            if record.tags:
                promo_count += 1

    since_7d = date.today() - timedelta(days=7)
    changes_result = await db.execute(
        select(func.count()).select_from(PriceChange).where(PriceChange.detected_at >= since_7d)
    )
    recent_changes = changes_result.scalar() or 0

    return {
        "product_count": len(products),
        "total_ref": total_ref,
        "total_current": total_current if products_with_price else None,
        "savings": total_ref - total_current if products_with_price else None,
        "promo_count": promo_count,
        "recent_changes_7d": recent_changes,
    }
