from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domain.prices.models import PriceRecord, PriceChange

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
    return {"message": "TODO: implement summary"}
