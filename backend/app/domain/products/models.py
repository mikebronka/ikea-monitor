from datetime import datetime

from sqlalchemy import Boolean, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    article_no: Mapped[str] = mapped_column(String(12), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(500))
    ref_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="normal")
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    price_records: Mapped[list["PriceRecord"]] = relationship(back_populates="product")
    list_items: Mapped[list["ListProduct"]] = relationship(back_populates="product")

    @property
    def item_no(self) -> str:
        return self.article_no.replace(".", "")

    @property
    def ikea_url(self) -> str:
        return f"https://www.ikea.com/pl/pl/p/-s{self.item_no}/"
