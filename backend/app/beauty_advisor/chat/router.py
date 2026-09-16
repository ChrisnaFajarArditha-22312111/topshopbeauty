"""
router.py — Endpoint API Konsultasi AI Beauty Advisor
Prefix: /api/v1/beauty-advisor
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_optional
from app.auth.schemas import MessageResponse
from app.beauty_advisor.chat.schemas import (
    ChatMessageRequest,
    ChatResponse,
    ConversationDetailResponse,
    ConversationSummaryResponse,
)
from app.beauty_advisor.chat import service

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, summary="Konsultasi Produk dengan AI Beauty Advisor")
async def chat_with_advisor(
    data: ChatMessageRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """
    Kirim pesan konsultasi kecantikan/skincare ke AI Beauty Advisor.
    Menerapkan alur: Input Guard -> Query Analyzer -> PostgreSQL Filter + pgvector RAG -> Recommendation Engine -> Qwen -> Output Guard.
    Bisa diakses oleh pengunjung umum (guest) maupun pengguna yang login.
    """
    user_id = uuid.UUID(current_user["sub"]) if current_user and "sub" in current_user else None
    return await service.process_chat_message(db, user_id, data)


@router.get("/conversations", response_model=List[ConversationSummaryResponse], summary="Daftar Sesi Konsultasi Pengguna")
async def list_conversations(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat seluruh riwayat sesi konsultasi yang pernah dilakukan oleh user."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_user_conversations(db, user_id)


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse, summary="Detail Riwayat Konsultasi")
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat percakapan lengkap dari satu sesi konsultasi AI."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_conversation_detail(db, user_id, conversation_id)


@router.delete("/conversations/{conversation_id}", response_model=MessageResponse, summary="Hapus Sesi Konsultasi")
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus satu sesi percakapan dari riwayat konsultasi."""
    user_id = uuid.UUID(current_user["sub"])
    await service.delete_conversation(db, user_id, conversation_id)
    return MessageResponse(message="Sesi percakapan berhasil dihapus.")
