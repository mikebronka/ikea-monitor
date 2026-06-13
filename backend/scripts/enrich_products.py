"""Fetch names and images from IKEA API for products that have placeholder names."""
import asyncio
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, or_

from app.database import async_session, engine, Base
from app.domain.products.models import Product
from app.domain.prices.models import PriceRecord, PriceChange, TagChange
from app.domain.lists.models import ShoppingList, ListProduct

SEARCH_API = "https://sik.search.blue.cdtapps.com/pl/pl/search-result-page"


async def fetch_info(client: httpx.AsyncClient, article_no: str) -> dict | None:
    item_no = article_no.replace(".", "")
    try:
        resp = await client.get(
            SEARCH_API,
            params={"q": item_no, "size": 1},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        if resp.status_code != 200:
            return None
        data = resp.json()
        items = (
            data.get("searchResultPage", {})
            .get("products", {})
            .get("main", {})
            .get("items", [])
        )
        if not items:
            return None
        product = items[0].get("product", {})
        result_id = str(product.get("id", "")).lstrip("0")
        expected_id = item_no.lstrip("0")
        if result_id != expected_id:
            return None
        name = product.get("name", "")
        type_name = product.get("typeName", "")
        image = product.get("mainImageUrl", "")
        full_name = f"{name} {type_name}".strip() if type_name else name
        return {"name": full_name, "image_url": image}
    except Exception as e:
        print(f"  Error for {article_no}: {e}")
        return None


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        result = await session.execute(
            select(Product).where(
                or_(Product.image_url.is_(None), Product.name == Product.article_no)
            )
        )
        products = result.scalars().all()
        print(f"Products to enrich: {len(products)}")

        async with httpx.AsyncClient() as client:
            for product in products:
                info = await fetch_info(client, product.article_no)
                if info:
                    if product.name == product.article_no and info["name"]:
                        product.name = info["name"]
                    if not product.image_url and info["image_url"]:
                        product.image_url = info["image_url"]
                    print(f"  OK  {product.article_no} — {product.name}")
                else:
                    print(f"  --  {product.article_no} — not found in IKEA API")
                await asyncio.sleep(2)

        await session.commit()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
