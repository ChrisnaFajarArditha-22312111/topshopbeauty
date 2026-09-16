"""
schemas.py — Schemas Pydantic untuk AI Beauty Advisor Chat API
"""
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=1000, description="Pesan atau pertanyaan konsultasi dari pengguna")
    conversation_id: Optional[uuid.UUID] = Field(None, description="ID sesi percakapan sebelumnya (jika ingin melanjutkan sesi)")


class RecommendedProductItem(BaseModel):
    id: uuid.UUID
    nama_produk: str
    brand: Optional[str] = None
    category: Optional[str] = None
    harga: float
    rating: float
    foto_utama: Optional[str] = None
    stok: int

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    reply: str
    recommended_products: List[RecommendedProductItem] = []
    suggested_followups: List[str] = []


class MessageHistoryItem(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime
    messages: List[MessageHistoryItem] = []

    class Config:
        from_attributes = True


class ConversationSummaryResponse(BaseModel):
    id: uuid.UUID
    title: str
    last_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
