"""
models.py — Model Wishlist untuk Produk Favorit Pengguna
"""
import uuid
from sqlalchemy import ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.core.models_base import TimestampMixin


class Wishlist(Base, TimestampMixin):
    """Tabel: wishlist — daftar produk yang disimpan oleh user."""
    __tablename__ = "wishlist"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)

    user: Mapped["User"] = relationship("User")
    product: Mapped["Product"] = relationship("Product")

    __table_args__ = (
        Index("ix_user_product_wishlist_unique", "user_id", "product_id", unique=True),
    )
