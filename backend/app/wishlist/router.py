"""
router.py — Endpoint API Wishlist
Prefix: /api/v1/wishlist
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.wishlist.schemas import (
    WishlistItemResponse,
    AddWishlistRequest,
    MoveWishlistToCartRequest,
)
from app.wishlist import service
from app.cart.schemas import CartResponse
from app.auth.schemas import MessageResponse

router = APIRouter()


@router.get("", response_model=List[WishlistItemResponse], summary="Daftar Wishlist User")
async def get_wishlist(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat seluruh produk yang disimpan di wishlist."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_user_wishlist(db, user_id)


@router.post("", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED, summary="Tambah ke Wishlist")
async def add_wishlist(
    data: AddWishlistRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menambahkan produk ke wishlist."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.add_to_wishlist(db, user_id, data.product_id)


@router.post("/move-to-cart", response_model=CartResponse, summary="Pindahkan Wishlist ke Keranjang")
async def move_to_cart(
    data: MoveWishlistToCartRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Memindahkan produk dari wishlist ke dalam keranjang belanja."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.move_wishlist_to_cart(db, user_id, data.product_id, data.quantity)


@router.delete("/{product_id}", response_model=MessageResponse, summary="Hapus dari Wishlist")
async def remove_wishlist(
    product_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus produk dari wishlist."""
    user_id = uuid.UUID(current_user["sub"])
    await service.remove_from_wishlist(db, user_id, product_id)
    return MessageResponse(message="Produk berhasil dihapus dari wishlist.")
