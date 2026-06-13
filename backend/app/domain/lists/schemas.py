from datetime import datetime

from pydantic import BaseModel


class ListCreate(BaseModel):
    name: str
    description: str | None = None


class ListUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class ListProductAdd(BaseModel):
    article_no: str
    quantity: int = 1


class ListResponse(BaseModel):
    id: int
    name: str
    description: str | None
    product_count: int = 0
    total_current: float | None = None
    total_ref: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ListDetailResponse(ListResponse):
    items: list["ListItemResponse"] = []


class ListItemResponse(BaseModel):
    id: int
    product_id: int
    article_no: str
    name: str
    image_url: str | None
    quantity: int
    current_price: float | None = None
    ref_price: float
    ikea_url: str

    model_config = {"from_attributes": True}
