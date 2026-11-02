"""
router.py — Endpoint API Master Data Skin Types
Prefix: /api/v1/skin-types
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.products.schemas import SkinTypeResponse
from app.products.service import get_all_skin_types

router = APIRouter()

@router.get("", response_model=List[SkinTypeResponse], summary="Daftar Tipe Kulit")
async def list_skin_types(db: AsyncSession = Depends(get_db)):
    """Mengambil seluruh master data tipe kulit (All Skin Types, Dry, Oily, Sensitive, dll)."""
    return await get_all_skin_types(db)
