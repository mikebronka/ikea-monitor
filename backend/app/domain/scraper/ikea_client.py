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

        prev_price = None
        previous = sales_price.get("previous", {})
        if isinstance(previous, dict) and previous.get("wholeNumber"):
            whole = previous["wholeNumber"]
            decimals = previous.get("decimals", "")
            try:
                prev_price = float(f"{whole}.{decimals}") if decimals else float(whole)
            except ValueError:
                pass

        lowest_30d = None
        lowest = sales_price.get("lowestPreviousSalesPrice", {})
        if isinstance(lowest, dict) and lowest.get("wholeNumber"):
            whole = lowest["wholeNumber"]
            decimals = lowest.get("decimals", "")
            try:
                lowest_30d = float(f"{whole}.{decimals}") if decimals else float(whole)
            except ValueError:
                pass

        return {
            "price": float(price) if price is not None else None,
            "previous_price": prev_price,
            "lowest_30d_price": lowest_30d,
            "tags": tags,
        }
    except Exception as e:
        log.debug(f"API error for {article_no}: {e}")
        return None
