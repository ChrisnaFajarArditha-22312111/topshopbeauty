"""
router.py — Endpoint API Ulasan & Rating Produk
Prefix: /api/v1/reviews
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.reviews.schemas import (
    CreateReviewRequest,
    ReviewResponse,
    ProductReviewsSummaryResponse,
)
from app.reviews import service

router = APIRouter()


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED, summary="Buat Ulasan Produk")
async def create_review(
    data: CreateReviewRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Memberikan rating dan ulasan untuk item produk yang telah dibeli.
    Hanya produk dari pesanan berbayar/selesai yang dapat diulas.
    """
    user_id = uuid.UUID(current_user["sub"])
    return await service.create_product_review(db, user_id, data)


@router.get("/product/{product_id}", response_model=ProductReviewsSummaryResponse, summary="Lihat Ulasan Produk")
async def get_product_reviews(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Melihat seluruh ulasan, foto pembeli, dan nilai rata-rata rating suatu produk."""
    return await service.get_reviews_by_product_id(db, product_id)


@router.get("/me", response_model=List[ReviewResponse], summary="Daftar Ulasan Saya")
async def get_my_reviews(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat seluruh riwayat ulasan yang pernah Anda buat."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_user_reviews(db, user_id)
