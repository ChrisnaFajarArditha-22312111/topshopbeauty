"""
models.py — Model Order, OrderItem, Payment, Shipment, dan Review
Sesuai PRD Topshop Kosmetik AI
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String,
    Numeric,
    Integer,
    DateTime,
    Boolean,
    Text,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.core.models_base import TimestampMixin


class Order(Base, TimestampMixin):
    """
    Tabel: orders — status pesanan:
    pending (menunggu pembayaran) -> paid (dibayar) -> processing (diproses) -> shipped (dikirim) -> completed (selesai) / cancelled
    """
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

    status: Mapped[str] = mapped_column(String(30), default="pending", index=True, nullable=False)

    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    shipping_cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    voucher_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("vouchers.id", ondelete="SET NULL"), nullable=True)

    # Snapshot informasi pengiriman
    shipping_recipient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    shipping_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False)
    shipping_city: Mapped[str] = mapped_column(String(100), nullable=False)
    shipping_postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    shipping_courier: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "jne", "sicepat", "jnt"
    shipping_service: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "reg", "oke"

    customer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    user: Mapped["User"] = relationship("User")
    voucher: Mapped[Optional["Voucher"]] = relationship("Voucher")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")
    payment: Mapped[Optional["Payment"]] = relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    shipment: Mapped[Optional["Shipment"]] = relationship("Shipment", back_populates="order", uselist=False, cascade="all, delete-orphan", lazy="selectin")


class OrderItem(Base, TimestampMixin):
    """Tabel: order_items — rincian barang per pesanan dengan snapshot harga saat beli."""
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)

    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")
    review: Mapped[Optional["Review"]] = relationship("Review", back_populates="order_item", uselist=False, lazy="selectin")



class Payment(Base, TimestampMixin):
    """
    Tabel: payments — integrasi Mayar Payment Gateway.
    Status: pending, paid, failed, expired, cancelled
    """
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    payment_method: Mapped[str] = mapped_column(String(50), default="mayar", nullable=False)
    mayar_transaction_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    mayar_payment_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending", index=True, nullable=False)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="payment")


class Shipment(Base, TimestampMixin):
    """
    Tabel: shipments — integrasi Biteship Shipping API.
    Mendukung tracking number dan live status pengiriman.
    """
    __tablename__ = "shipments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    courier_code: Mapped[str] = mapped_column(String(50), nullable=False)
    service_code: Mapped[str] = mapped_column(String(50), nullable=False)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    biteship_order_id: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)

    shipping_status: Mapped[str] = mapped_column(String(50), default="allocated", index=True, nullable=False)
    shipped_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="shipment")


class Review(Base, TimestampMixin):
    """
    Tabel: reviews — ulasan & rating produk.
    Hanya produk yang pernah dibeli dan berstatus 'completed' yang boleh di-review.
    """
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("order_items.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 - 5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    order_item: Mapped["OrderItem"] = relationship("OrderItem", back_populates="review")
    user: Mapped["User"] = relationship("User")
    product: Mapped["Product"] = relationship("Product")
