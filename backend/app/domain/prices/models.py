from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PriceRecord(Base):
    __tablename__ = "price_records"
    __table_args__ = (UniqueConstraint("product_id", "recorded_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    previous_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    lowest_30d_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    tags: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product: Mapped["Product"] = relationship(back_populates="price_records")


class PriceChange(Base):
    __tablename__ = "price_changes"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    old_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    new_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    change_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    change_pct: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    detected_at: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TagChange(Base):
    __tablename__ = "tag_changes"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    tags_added: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    tags_removed: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    tags_current: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    current_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    detected_at: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
