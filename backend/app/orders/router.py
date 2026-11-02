"""
router.py — Endpoint API Pesanan (Orders) Pengguna
Prefix: /api/v1/orders
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.orders.schemas import OrderResponse
from app.orders import service

router = APIRouter()


@router.get("", response_model=List[OrderResponse], summary="Riwayat Pesanan Pengguna")
async def list_orders(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat daftar seluruh pesanan yang pernah dibuat oleh user."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_user_orders(db, user_id)


@router.get("/{order_id}", response_model=OrderResponse, summary="Detail Pesanan")
async def get_order_detail(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat status, payment link, tracking kurir, dan rincian belanja satu pesanan."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_order_by_id(db, user_id, order_id)


@router.post("/{order_id}/cancel", response_model=OrderResponse, summary="Batalkan Pesanan")
async def cancel_order(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Membatalkan pesanan yang belum dibayar (status pending) dan mengembalikan stok."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.cancel_order(db, user_id, order_id)

