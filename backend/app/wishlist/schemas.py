"""
schemas.py — Schemas untuk Wishlist Produk Pengguna
"""
import uuid
from typing import Optional
from pydantic import BaseModel


class AddWishlistRequest(BaseModel):
    product_id: uuid.UUID


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


class MoveWishlistToCartRequest(BaseModel):
    product_id: uuid.UUID
    quantity: int = 1
