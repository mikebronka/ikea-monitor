from datetime import date, datetime

from pydantic import BaseModel


class ProductCreate(BaseModel):
    article_no: str
    name: str
    image_url: str | None = None
    ref_price: float
    current_price: float | None = None
    previous_price: float | None = None
    lowest_30d_price: float | None = None
    tags: list[str] = []
    priority: str = "normal"
    category: str
    quantity: int = 1


class ProductUpdate(BaseModel):
    name: str | None = None
    ref_price: float | None = None
    priority: str | None = None
    category: str | None = None
    image_url: str | None = None
    quantity: int | None = None


class ProductResponse(BaseModel):
    id: int
    article_no: str
    name: str
    image_url: str | None
    ref_price: float
    priority: str
    category: str
    quantity: int = 1
    ikea_url: str
    current_price: float | None = None
    previous_price: float | None = None
    lowest_30d_price: float | None = None
    latest_tags: list[str] = []
    price_vs_ref: float | None = None
    last_checked: date | None = None

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
