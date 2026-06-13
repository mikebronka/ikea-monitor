import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.domain.lists.router import router as lists_router
from app.domain.prices.router import router as prices_router
from app.domain.products.router import router as products_router
from app.domain.scraper.router import router as scraper_router
from app.domain.scraper.service import run_scraper
from app.domain.search.router import router as search_router

log = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    parts = settings.scraper_cron.split()
    if len(parts) == 5:
        trigger = CronTrigger(
            minute=parts[0], hour=parts[1], day=parts[2], month=parts[3], day_of_week=parts[4]
        )
        scheduler.add_job(run_scraper, trigger, id="daily_scraper", replace_existing=True)
        scheduler.start()
        log.info(f"Scheduler started with cron: {settings.scraper_cron}")
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(
    title="IKEA Price Monitor",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products_router, prefix="/api/v1/products", tags=["products"])
app.include_router(lists_router, prefix="/api/v1/lists", tags=["lists"])
app.include_router(prices_router, prefix="/api/v1/prices", tags=["prices"])
app.include_router(search_router, prefix="/api/v1/search", tags=["search"])
app.include_router(scraper_router, prefix="/api/v1/scraper", tags=["scraper"])


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
