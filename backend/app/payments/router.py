"""
router.py — Endpoint API Pembayaran & Webhook Callback Mayar
Prefix: /api/v1/payments
"""
from fastapi import APIRouter, Depends, Request, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.auth.schemas import MessageResponse
import uuid
from app.core.security import get_current_user
from app.orders.schemas import PaymentInfoResponse
from app.payments.service import (
    process_mayar_webhook, 
    get_payment_by_order_id,
    verify_and_sync_mayar_payment,
)

router = APIRouter()


@router.get("/order/{order_id}", response_model=PaymentInfoResponse, summary="Lihat Status Pembayaran Pesanan")
async def get_payment_info(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat status pembayaran dan otomatis mensinkronkan status dengan Mayar."""
    user_id = uuid.UUID(current_user["sub"])
    payment = await verify_and_sync_mayar_payment(db, order_id, user_id)
    return PaymentInfoResponse.model_validate(payment)


@router.post("/order/{order_id}/sync", response_model=PaymentInfoResponse, summary="Cek Status Lunas ke Mayar")
async def sync_payment_status(
    order_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Memaksa pengecekan status lunas ke Mayar API secara manual dari frontend."""
    user_id = uuid.UUID(current_user["sub"])
    payment = await verify_and_sync_mayar_payment(db, order_id, user_id)
    return PaymentInfoResponse.model_validate(payment)


from app.core.idempotency import (
    check_or_start_idempotency,
    complete_idempotency,
    fail_idempotency,
)


@router.post("/webhook", summary="Webhook Callback dari Mayar Gateway")
async def mayar_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Menerima callback status pembayaran otomatis dari Mayar Payment Gateway.
    Dilengkapi deduplikasi idempotency untuk mencegah pemrosesan callback ganda.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    idempotency_key = request.headers.get("Idempotency-Key") or request.headers.get("X-Callback-ID")
    if not idempotency_key:
        event_id = payload.get("id") or payload.get("data", {}).get("id") or payload.get("event_id")
        if event_id:
            idempotency_key = f"mayar_wh_{event_id}"

    if idempotency_key:
        is_hit, cached_status, cached_data = await check_or_start_idempotency(
            db=db,
            key=idempotency_key,
            request_path="/api/v1/payments/webhook",
            payload=payload,
        )
        if is_hit and cached_data:
            return cached_data

    try:
        success = await process_mayar_webhook(db, payload)
        result = {"status": "ok", "processed": success}
        if idempotency_key:
            await complete_idempotency(db, idempotency_key, 200, result)
        return result
    except Exception:
        if idempotency_key:
            await fail_idempotency(db, idempotency_key)
        raise

