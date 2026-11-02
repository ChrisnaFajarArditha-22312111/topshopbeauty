"""
router.py — Endpoint API Produk dan Master Data Beauty Advisor
Prefix: /api/v1/products, /api/v1/categories, /api/v1/brands, /api/v1/skin-types, /api/v1/skin-concerns
"""
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.products.schemas import (
    ProductFilterParams,
    PaginatedProductsResponse,
    ProductDetailResponse,
    BrandResponse,
    CategoryResponse,
    SkinTypeResponse,
    SkinConcernResponse,
)
from app.products import service

router = APIRouter()


@router.get(
    "",
    response_model=PaginatedProductsResponse,
    summary="Katalog Produk dengan Filter & Sorting",
)
async def list_products(
    q: Optional[str] = Query(None, description="Kata kunci pencarian nama atau deskripsi"),
    category: Optional[str] = Query(None, description="Filter nama kategori"),
    brand: Optional[str] = Query(None, description="Filter nama brand"),
    skin_type: Optional[str] = Query(None, description="Filter kecocokan tipe kulit"),
    skin_concern: Optional[str] = Query(None, description="Filter permasalahan kulit"),
    min_price: Optional[float] = Query(None, ge=0, description="Harga minimum"),
    max_price: Optional[float] = Query(None, ge=0, description="Harga maksimum"),
    is_skincare: Optional[bool] = Query(None, description="Hanya produk skincare"),
    sort_by: Optional[str] = Query("terlaris", regex="^(terlaris|termurah|termahal|rating|terbaru)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Menampilkan daftar produk dengan kemampuan filter, pencarian, dan pagination."""
    params = ProductFilterParams(
        query=q,
        category=category,
        brand=brand,
        skin_type=skin_type,
        skin_concern=skin_concern,
        min_price=min_price,
        max_price=max_price,
        is_skincare=is_skincare,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )
    return await service.get_products_paginated(db, params)


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    summary="Detail Lengkap Produk",
)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Mengambil informasi detail produk, gambar galeri, tipe kulit, masalah kulit, dan kandungan."""
    return await service.get_product_detail(db, product_id)
