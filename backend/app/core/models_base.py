"""
models_base.py — Base model dan mixins untuk SQLAlchemy ORM
Menyediakan timestamp mixin untuk created_at dan updated_at
"""
from datetime import datetime, timezone
from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class TimestampMixin:
    """Mixin untuk menambahkan created_at dan updated_at secara otomatis."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
