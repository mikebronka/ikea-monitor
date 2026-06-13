import asyncio
import logging

import httpx

log = logging.getLogger(__name__)

SEARCH_API = "https://sik.search.blue.cdtapps.com/pl/pl/search-result-page"


def article_to_item_no(article_no: str) -> str:
    return article_no.replace(".", "")


async def fetch_product_data(client: httpx.AsyncClient, article_no: str) -> dict | None:
    item_no = article_to_item_no(article_no)
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
        sales_price = product.get("salesPrice", {})
        price = sales_price.get("numeral")
        tags = sales_price.get("tags", [])
        return {
            "price": float(price) if price is not None else None,
            "tags": tags,
        }
    except Exception as e:
        log.debug(f"API error for {article_no}: {e}")
        return None
