"""
router.py — Endpoint API Pengiriman & Webhook Biteship
Prefix: /api/v1/shipping
"""
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.orders.schemas import CourierOptionResponse
from app.shipping import service
from app.addresses.service import get_address_by_id

router = APIRouter()


@router.get("/rates", response_model=List[CourierOptionResponse], summary="Cek Tarif Ongkos Kirim")
async def get_rates(
    address_id: uuid.UUID,
    courier: str = "all",
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghitung tarif ongkos kirim ke alamat pengguna."""
    user_id = uuid.UUID(current_user["sub"])
    addr = await get_address_by_id(db, user_id, address_id)
    c_filter = None if courier == "all" else courier
    return await service.calculate_biteship_rates(addr.postal_code, c_filter)


@router.get("/orders/{order_id}/tracking", summary="Lacak Paket Milik Pemesan")
async def track_order(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_order_tracking_info(db, order_id, uuid.UUID(current_user["sub"]), bool(current_user.get("is_admin")))


@router.get("/track/{tracking_number}", summary="Lacak Status Paket Kurir")
async def track_shipment(
    tracking_number: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Kompatibilitas klien lama: kode kurir selalu diambil dari pesanan yang berhak diakses.
    from sqlalchemy import select
    from app.orders.models import Order, Shipment
    stmt = select(Shipment.order_id).join(Order, Shipment.order_id == Order.id).where(Shipment.tracking_number == tracking_number)
    if not current_user.get("is_admin"):
        stmt = stmt.where(Order.user_id == uuid.UUID(current_user["sub"]))
    order_id = (await db.execute(stmt.limit(1))).scalar_one_or_none()
    if order_id is None:
        raise HTTPException(status_code=404, detail="Pengiriman tidak ditemukan")
    return await service.get_order_tracking_info(db, order_id, uuid.UUID(current_user["sub"]), bool(current_user.get("is_admin")))


from app.core.idempotency import (
    check_or_start_idempotency,
    complete_idempotency,
    fail_idempotency,
)


@router.post("/webhook", summary="Webhook Callback Status Pengiriman Biteship")
async def biteship_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Menerima live callback event status pengiriman dari Biteship dengan proteksi idempotency."""
    import hmac
    from app.core.config import settings
    if not settings.BITESHIP_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook pengiriman belum dikonfigurasi")
    actual_secret = request.headers.get(settings.BITESHIP_WEBHOOK_HEADER, "")
    if not hmac.compare_digest(actual_secret.encode(), settings.BITESHIP_WEBHOOK_SECRET.encode()):
        raise HTTPException(status_code=401, detail="Webhook tidak terautentikasi")
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload webhook harus object JSON")
    import hashlib
    import json
    idempotency_key = "biteship_wh_" + hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()

    if idempotency_key:
        is_hit, cached_status, cached_data = await check_or_start_idempotency(
            db=db,
            key=idempotency_key,
            request_path="/api/v1/shipping/webhook",
            payload=payload,
        )
        if is_hit and cached_data:
            return cached_data

    try:
        success = await service.process_biteship_webhook(db, payload)
        result = {"status": "ok", "processed": success}
        if idempotency_key:
            await complete_idempotency(db, idempotency_key, 200, result)
        return result
    except Exception:
        if idempotency_key:
            await fail_idempotency(db, idempotency_key)
        raise
