"""Import products from the original products.json into the database."""
import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select

from app.config import settings
from app.database import async_session, engine, Base
from app.domain.products.models import Product
from app.domain.prices.models import PriceRecord, PriceChange, TagChange
from app.domain.lists.models import ShoppingList, ListProduct


PRODUCTS_JSON = Path(__file__).parent.parent / "data" / "products.json"


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    if not PRODUCTS_JSON.exists():
        print(f"products.json not found at {PRODUCTS_JSON}")
        return

    with open(PRODUCTS_JSON, encoding="utf-8") as f:
        data = json.load(f)

    products = data.get("products", {})

    async with async_session() as session:
        for article_no, info in products.items():
            result = await session.execute(select(Product).where(Product.article_no == article_no))
            if result.scalar_one_or_none():
                print(f"  skip {article_no} (exists)")
                continue

            product = Product(
                article_no=article_no,
                name=info["name"],
                ref_price=info["ref_price"],
                priority=info.get("priority", "normal"),
                category=info.get("category", "other"),
            )
            session.add(product)
            print(f"  add  {article_no} — {info['name']}")

        await session.commit()

    print(f"Done. Imported from {PRODUCTS_JSON}")


if __name__ == "__main__":
    asyncio.run(seed())
