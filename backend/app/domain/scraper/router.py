import asyncio
from datetime import datetime

from fastapi import APIRouter

from app.domain.scraper.service import run_scraper

router = APIRouter()

_last_run: dict | None = None
_running = False
_progress: dict = {"current": 0, "total": 0, "current_product": ""}


@router.get("/status")
async def scraper_status():
    return {
        "last_run": _last_run,
        "is_running": _running,
        "progress": _progress if _running else None,
    }


def _on_progress(current: int, total: int, product_name: str):
    _progress["current"] = current
    _progress["total"] = total
    _progress["current_product"] = product_name


@router.post("/trigger")
async def trigger_scraper():
    global _last_run, _running
    if _running:
        return {"status": "already_running"}
    _running = True
    _progress.update(current=0, total=0, current_product="")
    try:
        stats = await run_scraper(on_progress=_on_progress)
        _last_run = {
            "finished_at": datetime.now().isoformat(),
            **stats,
        }
        return {"status": "completed", **stats}
    finally:
        _running = False
