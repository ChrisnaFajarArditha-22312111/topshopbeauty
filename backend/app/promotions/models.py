"""
models.py — Model Voucher dan Promosi
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, Integer, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.core.models_base import TimestampMixin


class Voucher(Base, TimestampMixin):
    """Tabel: vouchers — kupon diskon atau potongan belanja."""
    __tablename__ = "vouchers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    discount_type: Mapped[str] = mapped_column(String(20), default="fixed", nullable=False)  # "fixed" (potongan rupiah) / "percentage" (%)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    min_purchase: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    max_discount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)

    usage_limit: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
