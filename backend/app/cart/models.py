"""
models.py — Model Cart dan CartItem untuk Keranjang Belanja
"""
import uuid
from typing import List, Optional
from sqlalchemy import Integer, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.core.models_base import TimestampMixin


class Cart(Base, TimestampMixin):
    """Tabel: cart — satu user memiliki satu keranjang belanja aktif."""
    __tablename__ = "cart"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    items: Mapped[List["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base, TimestampMixin):
    """Tabel: cart_items — item produk yang dimasukkan ke dalam keranjang."""
    __tablename__ = "cart_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cart.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product: Mapped["Product"] = relationship("Product")

    __table_args__ = (
        Index("ix_cart_product_unique", "cart_id", "product_id", unique=True),
    )
