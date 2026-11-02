"""
router.py — Endpoint API Master Data Skin Concerns
Prefix: /api/v1/skin-concerns
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.products.schemas import SkinConcernResponse
from app.products.service import get_all_skin_concerns

router = APIRouter()

@router.get("", response_model=List[SkinConcernResponse], summary="Daftar Permasalahan Kulit")
async def list_skin_concerns(db: AsyncSession = Depends(get_db)):
    """Mengambil seluruh master data masalah kulit (Acne, Dullness, Hydration, Dark Spots, dll)."""
    return await get_all_skin_concerns(db)
