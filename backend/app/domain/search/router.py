from fastapi import APIRouter, Query

router = APIRouter()

SEARCH_API = "https://sik.search.blue.cdtapps.com/pl/pl/search-result-page"


@router.get("/")
async def search_ikea(q: str = Query(..., min_length=2)):
    import httpx

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            SEARCH_API,
            params={"q": q, "size": 20},
            headers={"Accept": "application/json"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

    items = (
        data.get("searchResultPage", {})
        .get("products", {})
        .get("main", {})
        .get("items", [])
    )

    results = []
    for item in items:
        product = item.get("product", {})
        pip_url = product.get("pipUrl", "")
        main_image = product.get("mainImageUrl", "")
        sales_price = product.get("salesPrice", {})

        article_parts = []
        item_no = str(product.get("id", ""))
        if len(item_no) >= 8:
            article_parts = [item_no[:3], item_no[3:6], item_no[6:]]
            article_no = ".".join(article_parts)
        else:
            article_no = item_no

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

        results.append({
            "article_no": article_no,
            "name": product.get("name", ""),
            "type_name": product.get("typeName", ""),
            "price": sales_price.get("numeral"),
            "previous_price": prev_price,
            "lowest_30d_price": lowest_30d,
            "tags": sales_price.get("tags", []),
            "image_url": main_image,
            "ikea_url": pip_url,
        })

    return {"results": results, "total": len(results)}
