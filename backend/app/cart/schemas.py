"""
schemas.py — Schemas untuk Cart & Wishlist
"""
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class AddToCartRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(1, ge=1)


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    nama_produk: str
    price: float
    harga: Optional[float] = None
    harga_asli: Optional[float] = None
    foto_utama: Optional[str] = None
    stok: int
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: uuid.UUID
    items: List[CartItemResponse] = []
    total_items: int
    total_price: float

    class Config:
        from_attributes = True


class WishlistItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    nama_produk: str
    price: float
    harga_asli: Optional[float] = None
    foto_utama: Optional[str] = None
    stok: int
    rating: float

    class Config:
        from_attributes = True


class AddWishlistRequest(BaseModel):
    product_id: uuid.UUID
