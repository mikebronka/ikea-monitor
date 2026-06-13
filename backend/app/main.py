from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.domain.products.router import router as products_router
from app.domain.lists.router import router as lists_router
from app.domain.prices.router import router as prices_router
from app.domain.search.router import router as search_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


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


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}
