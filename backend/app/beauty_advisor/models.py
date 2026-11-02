"""
models.py — Model Percakapan dan Pesan AI Beauty Advisor
Tabel: ai_conversations, ai_messages
"""
import uuid
from typing import List, Optional
from sqlalchemy import String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.core.models_base import TimestampMixin
from app.users.models import User
from app.profiles.models import Profile


class AIConversation(Base, TimestampMixin):
    """
    Tabel: ai_conversations — Menyimpan sesi konsultasi antara user dan Beauty Advisor.
    """
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), default="Konsultasi Kosmetik", nullable=False)

    messages: Mapped[List["AIMessage"]] = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")


class AIMessage(Base, TimestampMixin):
    """
    Tabel: ai_messages — Menyimpan setiap pesan dalam percakapan (user, assistant, system).
    """
    __tablename__ = "ai_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)

    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user", "assistant", "system"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Menyimpan ID produk rekomendasi dalam bentuk list string UUID
    recommended_product_ids: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    conversation: Mapped["AIConversation"] = relationship("AIConversation", back_populates="messages")
