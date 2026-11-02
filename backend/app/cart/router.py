"""
router.py — Endpoint API Keranjang Belanja (Cart)
Prefix: /api/v1/cart
"""
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.cart.schemas import CartResponse, AddToCartRequest, UpdateCartItemRequest
from app.cart import service

router = APIRouter()


@router.get("", response_model=CartResponse, summary="Lihat Keranjang Belanja")
async def get_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengambil isi keranjang belanja user."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_cart_details(db, user_id)


@router.post("/items", response_model=CartResponse, summary="Tambah Item ke Keranjang")
async def add_to_cart(
    data: AddToCartRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menambahkan produk ke dalam keranjang."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.add_item_to_cart(db, user_id, data.product_id, data.quantity)


@router.patch("/items/{item_id}", response_model=CartResponse, summary="Ubah Kuantitas Item")
async def update_cart_item(
    item_id: uuid.UUID,
    data: UpdateCartItemRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengubah jumlah kuantitas produk dalam keranjang."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.update_cart_item(db, user_id, item_id, data.quantity)


@router.delete("/items/{item_id}", response_model=CartResponse, summary="Hapus Item dari Keranjang")
async def remove_cart_item(
    item_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus satu produk dari keranjang."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.remove_cart_item(db, user_id, item_id)


@router.delete("", response_model=CartResponse, summary="Kosongkan Seluruh Keranjang")
async def clear_cart(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengosongkan semua produk yang ada di dalam keranjang belanja."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.clear_cart(db, user_id)

