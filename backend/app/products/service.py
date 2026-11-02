"""
service.py — Business logic katalog produk, filter dinamis, sorting, dan detail produk
"""
import uuid
from typing import Optional, List, Tuple
import math
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.products.models import (
    Product,
    Brand,
    Category,
    SubCategory,
    SkinType,
    SkinConcern,
    Ingredient,
    ProductImage,
    product_skin_types,
    product_skin_concerns,
    product_ingredients,
)
from app.products.schemas import (
    ProductFilterParams,
    ProductListResponse,
    ProductDetailResponse,
    PaginatedProductsResponse,
    BrandResponse,
    CategoryResponse,
    SubCategoryResponse,
    SkinTypeResponse,
    SkinConcernResponse,
    IngredientResponse,
    ProductImageResponse,
)


def format_product_list_item(p: Product) -> ProductListResponse:
    """Helper untuk format Product model ke ProductListResponse."""
    return ProductListResponse(
        id=p.id,
        item_id=p.item_id,
        nama_produk=p.nama_produk,
        brand_name=p.brand.name if p.brand else None,
        category_name=p.category.name if p.category else None,
        harga=float(p.harga),
        harga_asli=float(p.harga_asli) if p.harga_asli else None,
        diskon_persen=p.diskon_persen,
        stok=p.stok,
        terjual=p.terjual,
        rating=float(p.rating),
        foto_utama=p.foto_utama,
        is_skincare=p.is_skincare,
        usage_time=p.usage_time,
        texture=p.texture,
    )


async def get_products_paginated(
    db: AsyncSession,
    params: ProductFilterParams,
) -> PaginatedProductsResponse:
    """
    Mengambil produk dengan filter lengkap (Search text, Brand, Category,
    Skin Type, Skin Concern, Rentang Harga, dan Sorting).
    """
    query = (
        select(Product)
        .options(
            selectinload(Product.brand),
            selectinload(Product.category),
        )
    )

    # Filter pencarian teks (nama, search_document)
    if params.query:
        search_kw = f"%{params.query.strip()}%"
        query = query.where(
            or_(
                Product.nama_produk.ilike(search_kw),
                Product.search_document.ilike(search_kw),
            )
        )

    # Filter Kategori
    if params.category:
        query = query.join(Product.category).where(Category.name.ilike(params.category.strip()))

    # Filter Brand
    if params.brand:
        query = query.join(Product.brand).where(Brand.name.ilike(params.brand.strip()))

    # Filter Skin Type (Many-to-Many)
    if params.skin_type:
        query = query.join(Product.skin_types).where(SkinType.name.ilike(params.skin_type.strip()))

    # Filter Skin Concern (Many-to-Many)
    if params.skin_concern:
        query = query.join(Product.skin_concerns).where(SkinConcern.name.ilike(params.skin_concern.strip()))

    # Filter Harga
    if params.min_price is not None:
        query = query.where(Product.harga >= params.min_price)
    if params.max_price is not None:
        query = query.where(Product.harga <= params.max_price)

    # Filter Is Skincare
    if params.is_skincare is not None:
        query = query.where(Product.is_skincare == params.is_skincare)

    # Hitung total items
    count_stmt = select(func.count(func.distinct(Product.id))).select_from(query.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0

    # Sorting
    if params.sort_by == "termurah":
        query = query.order_by(asc(Product.harga))
    elif params.sort_by == "termahal":
        query = query.order_by(desc(Product.harga))
    elif params.sort_by == "rating":
        query = query.order_by(desc(Product.rating), desc(Product.terjual))
    elif params.sort_by == "terbaru":
        query = query.order_by(desc(Product.created_at))
    else:  # default: terlaris
        query = query.order_by(desc(Product.terjual), desc(Product.rating))

    # Pagination
    offset = (params.page - 1) * params.page_size
    query = query.offset(offset).limit(params.page_size)

    res = await db.execute(query)
    products = res.scalars().unique().all()

    items = [format_product_list_item(p) for p in products]
    total_pages = math.ceil(total / params.page_size) if total > 0 else 1

    return PaginatedProductsResponse(
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages,
        items=items,
    )


async def get_product_detail(db: AsyncSession, product_id: uuid.UUID) -> ProductDetailResponse:
    """Mengambil detail komprehensif satu produk beserta seluruh relasinya."""
    stmt = (
        select(Product)
        .options(
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.sub_category),
            selectinload(Product.images),
            selectinload(Product.skin_types),
            selectinload(Product.skin_concerns),
            selectinload(Product.ingredients),
        )
        .where(Product.id == product_id)
    )
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produk tidak ditemukan")

    return ProductDetailResponse(
        id=product.id,
        item_id=product.item_id,
        shop_id=product.shop_id,
        nama_produk=product.nama_produk,
        brand_name=product.brand.name if product.brand else None,
        category_name=product.category.name if product.category else None,
        sub_category_name=product.sub_category.name if product.sub_category else None,
        harga=float(product.harga),
        harga_asli=float(product.harga_asli) if product.harga_asli else None,
        diskon_persen=product.diskon_persen,
        stok=product.stok,
        terjual=product.terjual,
        rating=float(product.rating),
        foto_utama=product.foto_utama,
        url_produk=product.url_produk,
        is_skincare=product.is_skincare,
        usage_time=product.usage_time,
        texture=product.texture,
        search_document=product.search_document,
        images=[
            ProductImageResponse(id=img.id, image_url=img.image_url, sort_order=img.sort_order)
            for img in sorted(product.images, key=lambda x: x.sort_order)
        ],
        skin_types=[
            SkinTypeResponse(id=st.id, name=st.name, description=st.description)
            for st in product.skin_types
        ],
        skin_concerns=[
            SkinConcernResponse(id=sc.id, name=sc.name, description=sc.description)
            for sc in product.skin_concerns
        ],
        ingredients=[
            IngredientResponse(id=ing.id, name=ing.name, description=ing.description)
            for ing in product.ingredients
        ],
    )


# =========================================================
# Master Data Handlers
# =========================================================

async def get_all_brands(db: AsyncSession) -> List[BrandResponse]:
    """Mengambil semua daftar Brand."""
    stmt = select(Brand).order_by(Brand.name)
    res = await db.execute(stmt)
    return [BrandResponse.model_validate(b) for b in res.scalars().all()]


async def get_all_categories(db: AsyncSession) -> List[CategoryResponse]:
    """Mengambil semua daftar Kategori dan Subkategori."""
    stmt = select(Category).options(selectinload(Category.sub_categories)).order_by(Category.name)
    res = await db.execute(stmt)
    return [CategoryResponse.model_validate(c) for c in res.scalars().all()]


async def get_all_skin_types(db: AsyncSession) -> List[SkinTypeResponse]:
    """Mengambil seluruh master data Skin Type."""
    stmt = select(SkinType).order_by(SkinType.name)
    res = await db.execute(stmt)
    return [SkinTypeResponse.model_validate(st) for st in res.scalars().all()]


async def get_all_skin_concerns(db: AsyncSession) -> List[SkinConcernResponse]:
    """Mengambil seluruh master data Skin Concern."""
    stmt = select(SkinConcern).order_by(SkinConcern.name)
    res = await db.execute(stmt)
    return [SkinConcernResponse.model_validate(sc) for sc in res.scalars().all()]
