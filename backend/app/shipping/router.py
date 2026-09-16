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


@router.get("/track/{tracking_number}", summary="Lacak Status Paket Kurir")
async def track_shipment(
    tracking_number: str,
    current_user: dict = Depends(get_current_user),
):
    """Melacak status posisi pengiriman paket berdasarkan resi."""
    return await service.get_tracking_info(tracking_number)


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
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Callback-ID")
    if not idempotency_key:
        event_id = payload.get("order_id") or payload.get("courier_tracking_id") or payload.get("tracking_id")
        status_val = payload.get("status")
        if event_id and status_val:
            idempotency_key = f"biteship_wh_{event_id}_{status_val}"

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
