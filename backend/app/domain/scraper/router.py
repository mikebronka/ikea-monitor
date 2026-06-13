import asyncio
from datetime import datetime

from fastapi import APIRouter

from app.domain.scraper.service import run_scraper

router = APIRouter()

_last_run: dict | None = None
_running = False


@router.get("/status")
async def scraper_status():
    return {
        "last_run": _last_run,
        "is_running": _running,
    }


@router.post("/trigger")
async def trigger_scraper():
    global _last_run, _running
    if _running:
        return {"status": "already_running"}
    _running = True
    try:
        stats = await run_scraper()
        _last_run = {
            "finished_at": datetime.now().isoformat(),
            **stats,
        }
        return {"status": "completed", **stats}
    finally:
        _running = False
