"""Import product quantities from IKEA kitchen planner CSV export."""
import asyncio
import csv
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select

from app.database import async_session, engine, Base
from app.domain.products.models import Product
from app.domain.prices.models import PriceRecord, PriceChange, TagChange
from app.domain.lists.models import ShoppingList, ListProduct


CSV_PATH = Path(__file__).parent.parent / "data" / "lista_ikea.csv"


async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    quantities = defaultdict(int)
    prices = {}
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            article_no = row["numer towaru ikea"].strip()
            qty = int(row["ilosc"].strip())
            price = float(row["cena jedn. (PLN)"].strip())
            quantities[article_no] += qty
            prices[article_no] = price

    print(f"Unique products in CSV: {len(quantities)}")
    print(f"Total items: {sum(quantities.values())}")

    async with async_session() as session:
        updated = 0
        created = 0
        for article_no, qty in sorted(quantities.items()):
            result = await session.execute(
                select(Product).where(Product.article_no == article_no)
            )
            product = result.scalar_one_or_none()

            if product:
                product.quantity = qty
                if not product.ref_price or float(product.ref_price) == 0:
                    product.ref_price = prices[article_no]
                print(f"  UPD {article_no} qty={qty} — {product.name}")
                updated += 1
            else:
                product = Product(
                    article_no=article_no,
                    name=article_no,
                    ref_price=prices[article_no],
                    quantity=qty,
                    category="other",
                )
                session.add(product)
                print(f"  NEW {article_no} qty={qty} price={prices[article_no]}")
                created += 1

        await session.commit()

    print(f"\nDone. Updated: {updated}, Created: {created}")


if __name__ == "__main__":
    asyncio.run(main())
