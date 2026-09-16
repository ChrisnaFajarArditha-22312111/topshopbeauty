"""
router.py — Endpoint API Master Data Brands
Prefix: /api/v1/brands
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.products.schemas import BrandResponse
from app.products.service import get_all_brands

router = APIRouter()

@router.get("", response_model=List[BrandResponse], summary="Daftar Seluruh Brand")
async def list_brands(db: AsyncSession = Depends(get_db)):
    """Mengambil seluruh data brand kosmetik dan skincare."""
    return await get_all_brands(db)
