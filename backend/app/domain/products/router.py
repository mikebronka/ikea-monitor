import json
import logging
import re

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.domain.prices.models import PriceRecord
from app.domain.products.models import Product
from app.domain.products.schemas import ProductCreate, ProductListResponse, ProductResponse, ProductUpdate

log = logging.getLogger(__name__)

router = APIRouter()


async def _enrich_product(product: Product, db: AsyncSession) -> ProductResponse:
    latest = await db.execute(
        select(PriceRecord)
        .where(PriceRecord.product_id == product.id)
        .order_by(PriceRecord.recorded_at.desc())
        .limit(1)
    )
    record = latest.scalar_one_or_none()
    resp = ProductResponse.model_validate(product)
    if record:
        resp.current_price = float(record.price)
        resp.previous_price = float(record.previous_price) if record.previous_price else None
        resp.lowest_30d_price = float(record.lowest_30d_price) if record.lowest_30d_price else None
        resp.latest_tags = record.tags or []
        resp.last_checked = record.recorded_at
        if product.ref_price:
            resp.price_vs_ref = round((float(record.price) - float(product.ref_price)) / float(product.ref_price) * 100, 1)
    return resp


@router.get("/", response_model=ProductListResponse)
async def list_products(
    category: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    list_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.is_active.is_(True))
    if category:
        query = query.where(Product.category == category)
    if priority:
        query = query.where(Product.priority == priority)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    result = await db.execute(query.order_by(Product.name))
    products = result.scalars().all()

    items = [await _enrich_product(p, db) for p in products]
    return ProductListResponse(items=items, total=total)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one()
    return await _enrich_product(product, db)


@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    from datetime import date

    existing = await db.execute(select(Product).where(Product.article_no == data.article_no))
    product = existing.scalar_one_or_none()
    if product:
        if not product.is_active:
            product.is_active = True
            product.ref_price = data.ref_price
            product.name = data.name
            product.image_url = data.image_url
        price = data.current_price if data.current_price is not None else data.ref_price
        existing_record = await db.execute(
            select(PriceRecord).where(
                PriceRecord.product_id == product.id,
                PriceRecord.recorded_at == date.today(),
            )
        )
        if not existing_record.scalar_one_or_none():
            db.add(PriceRecord(
                product_id=product.id,
                price=price,
                previous_price=data.previous_price,
                lowest_30d_price=data.lowest_30d_price,
                tags=data.tags or [],
                recorded_at=date.today(),
            ))
        await db.commit()
        await db.refresh(product)
        return await _enrich_product(product, db)

    create_data = data.model_dump(exclude={"current_price", "previous_price", "lowest_30d_price", "tags"})
    product = Product(**create_data)
    db.add(product)
    await db.flush()

    price = data.current_price if data.current_price is not None else data.ref_price
    db.add(PriceRecord(
        product_id=product.id,
        price=price,
        previous_price=data.previous_price,
        lowest_30d_price=data.lowest_30d_price,
        tags=data.tags or [],
        recorded_at=date.today(),
    ))
    await db.commit()
    await db.refresh(product)
    return await _enrich_product(product, db)


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, data: ProductUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one()
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return ProductResponse.model_validate(product)


@router.get("/{product_id}/images")
async def get_product_images(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one()

    images: list[str] = []
    if product.ikea_url:
        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(
                    product.ikea_url,
                    headers={"User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"},
                    timeout=15,
                )
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                for script in soup.find_all("script", type="application/ld+json"):
                    try:
                        data = json.loads(script.string or "")
                        if isinstance(data, dict) and "image" in data:
                            imgs = data["image"]
                            if isinstance(imgs, list):
                                images = [u for u in imgs if isinstance(u, str)]
                            elif isinstance(imgs, str):
                                images = [imgs]
                            break
                    except json.JSONDecodeError:
                        pass
                if not images:
                    seen = set()
                    for img in soup.find_all("img", src=re.compile(r"/images/products/")):
                        src = img["src"].split("?")[0]
                        if src not in seen:
                            seen.add(src)
                            images.append(src)
        except Exception as e:
            log.debug(f"Failed to fetch images for product {product_id}: {e}")

    if not images and product.image_url:
        images = [product.image_url]

    return {"images": images}


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one()
    product.is_active = False
    await db.commit()
