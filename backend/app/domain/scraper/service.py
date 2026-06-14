import asyncio
import logging
from datetime import date

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.config import settings
from app.domain.products.models import Product
from app.domain.prices.models import PriceChange, PriceRecord, TagChange
from app.domain.scraper.ikea_client import fetch_product_data

log = logging.getLogger(__name__)


async def run_scraper(on_progress=None) -> dict:
    log.info("Scraper started")
    today = date.today()
    stats = {"checked": 0, "price_changes": 0, "tag_changes": 0, "errors": 0}

    async with async_session() as db:
        result = await db.execute(
            select(Product).where(Product.is_active.is_(True)).order_by(Product.id)
        )
        products = result.scalars().all()

    total = len(products)
    async with httpx.AsyncClient() as client:
        for i, product in enumerate(products):
            if on_progress:
                on_progress(i + 1, total, product.name)
            try:
                await _check_product(client, product, today)
                stats["checked"] += 1
            except Exception as e:
                log.error(f"Error checking {product.article_no}: {e}")
                stats["errors"] += 1
            await asyncio.sleep(settings.request_delay_seconds)

    log.info(f"Scraper finished: {stats}")
    return stats


async def _check_product(client: httpx.AsyncClient, product: Product, today: date):
    data = await fetch_product_data(client, product.article_no)
    if not data or data["price"] is None:
        log.debug(f"No price for {product.article_no}")
        return

    current_price = data["price"]
    current_tags = data.get("tags", [])
    previous_price = data.get("previous_price")
    lowest_30d_price = data.get("lowest_30d_price")

    async with async_session() as db:
        existing = await db.execute(
            select(PriceRecord).where(
                PriceRecord.product_id == product.id,
                PriceRecord.recorded_at == today,
            )
        )
        record = existing.scalar_one_or_none()

        if record:
            record.price = current_price
            record.previous_price = previous_price
            record.lowest_30d_price = lowest_30d_price
            record.tags = current_tags
        else:
            record = PriceRecord(
                product_id=product.id,
                price=current_price,
                previous_price=previous_price,
                lowest_30d_price=lowest_30d_price,
                tags=current_tags,
                recorded_at=today,
            )
            db.add(record)

        if previous_price and abs(float(product.ref_price) - previous_price) > 0.01:
            log.info(f"  {product.name}: ref_price {product.ref_price} -> {previous_price}")
            product.ref_price = previous_price
            db.add(product)

        prev_result = await db.execute(
            select(PriceRecord)
            .where(PriceRecord.product_id == product.id, PriceRecord.recorded_at < today)
            .order_by(PriceRecord.recorded_at.desc())
            .limit(1)
        )
        prev_record = prev_result.scalar_one_or_none()

        if prev_record and abs(float(prev_record.price) - current_price) > 0.01:
            old_price = float(prev_record.price)
            change_amount = current_price - old_price
            change_pct = (change_amount / old_price) * 100
            price_change = PriceChange(
                product_id=product.id,
                old_price=old_price,
                new_price=current_price,
                change_amount=change_amount,
                change_pct=change_pct,
                detected_at=today,
            )
            db.add(price_change)
            log.info(f"  {product.name}: {old_price:.2f} -> {current_price:.2f} ({change_amount:+.2f})")

        prev_tags = prev_record.tags if prev_record else []
        if set(current_tags) != set(prev_tags):
            added = [t for t in current_tags if t not in prev_tags]
            removed = [t for t in prev_tags if t not in current_tags]
            tag_change = TagChange(
                product_id=product.id,
                tags_added=added,
                tags_removed=removed,
                tags_current=current_tags,
                current_price=current_price,
                detected_at=today,
            )
            db.add(tag_change)
            log.info(f"  {product.name}: tags {prev_tags} -> {current_tags}")

        await db.commit()
