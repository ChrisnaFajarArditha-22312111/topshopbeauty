"""
schemas.py — Schemas untuk Review & Ulasan Produk
"""
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CreateReviewRequest(BaseModel):
    order_item_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5, description="Rating dari 1 sampai 5 bintang")
    comment: Optional[str] = None
    photo_url: Optional[str] = None


class ReviewResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    user_id: uuid.UUID
    user_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProductReviewsSummaryResponse(BaseModel):
    product_id: uuid.UUID
    average_rating: float
    total_reviews: int
    reviews: List[ReviewResponse] = []
