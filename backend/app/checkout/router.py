"""
router.py — Endpoint API Checkout & Perhitungan Tarif Ongkir
Prefix: /api/v1/checkout
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.idempotency import (
    check_or_start_idempotency,
    complete_idempotency,
    fail_idempotency,
)
from app.orders.schemas import (
    CheckoutPreviewRequest,
    CheckoutPreviewResponse,
    CreateOrderRequest,
    OrderResponse,
    CourierOptionResponse,
)
from app.orders import service as order_service
from app.shipping.service import calculate_biteship_rates
from app.addresses.service import get_address_by_id

router = APIRouter()


@router.get("/shipping-rates", response_model=List[CourierOptionResponse], summary="Cek Tarif Ongkir Kurir")
async def get_shipping_rates(
    address_id: uuid.UUID,
    courier: str = "all",
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghitung tarif ongkos kirim ke alamat pengguna."""
    user_id = uuid.UUID(current_user["sub"])
    addr = await get_address_by_id(db, user_id, address_id)
    c_filter = None if courier == "all" else courier
    return await calculate_biteship_rates(addr.postal_code, c_filter)


@router.post("/preview", response_model=CheckoutPreviewResponse, summary="Kalkulasi Rincian Checkout")
async def preview_checkout(
    data: CheckoutPreviewRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat kalkulasi subtotal, diskon voucher, ongkir, dan total tagihan sebelum checkout."""
    user_id = uuid.UUID(current_user["sub"])
    return await order_service.preview_checkout(db, user_id, data)


@router.post("", response_model=OrderResponse, summary="Proses Buat Pesanan (Checkout)")
async def create_order(
    data: CreateOrderRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key", description="Kunci unik pencegah order ganda"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menyelesaikan pembelian, membuat link bayar Mayar, dan membuat pesanan resmi (didukung Idempotency)."""
    user_id = uuid.UUID(current_user["sub"])

    if idempotency_key:
        is_hit, cached_status, cached_data = await check_or_start_idempotency(
            db=db,
            key=idempotency_key,
            request_path="/api/v1/checkout",
            payload=data,
            user_id=user_id,
        )
        if is_hit and cached_data:
            return cached_data

    try:
        order = await order_service.create_order_from_cart(db, user_id, data)
        result = await order_service.get_order_by_id(db, user_id, order.id)
        if idempotency_key:
            await complete_idempotency(db, idempotency_key, 200, result)
        return result
    except Exception:
        if idempotency_key:
            await fail_idempotency(db, idempotency_key)
        raise
