"""
schemas.py — Pydantic Schemas untuk Katalog Produk dan Filter
"""
import uuid
from typing import Optional, List
from pydantic import BaseModel, Field


# =========================================================
# Brand, Category, SubCategory Schemas
# =========================================================

class BrandResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None

    class Config:
        from_attributes = True


class SubCategoryResponse(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    slug: str

    class Config:
        from_attributes = True


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    sub_categories: List[SubCategoryResponse] = []

    class Config:
        from_attributes = True


# =========================================================
# Master Data Schemas
# =========================================================

class SkinTypeResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class SkinConcernResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class IngredientResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# =========================================================
# Product Schemas
# =========================================================

class ProductImageResponse(BaseModel):
    id: uuid.UUID
    image_url: str
    sort_order: int

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    id: uuid.UUID
    item_id: Optional[int] = None
    nama_produk: str
    brand_name: Optional[str] = None
    category_name: Optional[str] = None
    harga: float
    harga_asli: Optional[float] = None
    diskon_persen: Optional[str] = None
    stok: int
    terjual: int
    rating: float
    foto_utama: Optional[str] = None
    is_skincare: bool
    usage_time: Optional[str] = None
    texture: Optional[str] = None

    class Config:
        from_attributes = True


class ProductDetailResponse(ProductListResponse):
    shop_id: Optional[int] = None
    sub_category_name: Optional[str] = None
    url_produk: Optional[str] = None
    search_document: Optional[str] = None
    images: List[ProductImageResponse] = []
    skin_types: List[SkinTypeResponse] = []
    skin_concerns: List[SkinConcernResponse] = []
    ingredients: List[IngredientResponse] = []

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    nama_produk: str = Field(..., min_length=3, max_length=255)
    brand_name: Optional[str] = None
    category_name: Optional[str] = None
    sub_category_name: Optional[str] = None
    harga: float = Field(..., gt=0)
    harga_asli: Optional[float] = None
    diskon_persen: Optional[str] = None
    stok: int = Field(0, ge=0)
    foto_utama: Optional[str] = None
    is_skincare: bool = True
    usage_time: Optional[str] = None
    texture: Optional[str] = None
    skin_types: List[str] = []
    skin_concerns: List[str] = []
    ingredients: List[str] = []
    gallery_images: List[str] = []


class ProductFilterParams(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    skin_type: Optional[str] = None
    skin_concern: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    is_skincare: Optional[bool] = None
    sort_by: Optional[str] = "terlaris" # "terlaris", "termurah", "termahal", "rating", "terbaru"
    page: int = 1
    page_size: int = 20


class PaginatedProductsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[ProductListResponse]
