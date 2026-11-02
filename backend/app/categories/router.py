"""
router.py — Endpoint API Master Data Kategori
Prefix: /api/v1/categories
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.products.schemas import CategoryResponse
from app.products.service import get_all_categories

router = APIRouter()

@router.get("", response_model=List[CategoryResponse], summary="Daftar Seluruh Kategori")
async def list_categories(db: AsyncSession = Depends(get_db)):
    """Mengambil seluruh data kategori dan subkategori kosmetik."""
    return await get_all_categories(db)
