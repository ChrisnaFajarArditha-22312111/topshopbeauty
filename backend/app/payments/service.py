"""
service.py — Layanan integrasi Payment Gateway Mayar
Mendukung pembuatan invoice/payment link dan pemrosesan webhook callback
"""
import uuid
import hmac
import hashlib
import json
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.core.config import settings
from app.orders.models import Order, Payment


async def create_mayar_payment_invoice(
    order: Order,
    user_email: str = "",
) -> Dict[str, Any]:
    """
    Membuat invoice pembayaran Mayar melalui Mayar API.
    Jika API key belum diisi (mode dev/test), mengembalikan simulasi invoice URL yang valid.
    """
    if not settings.MAYAR_API_KEY or "your_mayar" in settings.MAYAR_API_KEY:
        # Simulasi Sandbox Mode untuk dev
        return {
            "id": f"mayar_test_{uuid.uuid4().hex[:12]}",
            "payment_url": f"https://sandbox.mayar.id/pay/invoice-{order.order_number}",
            "amount": float(order.total_amount),
            "status": "pending",
        }

    # Panggilan ke live Mayar API
    url = "https://api.mayar.id/hl/v1/payment/create"
    headers = {
        "Authorization": f"Bearer {settings.MAYAR_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "amount": int(order.total_amount),
        "name": order.shipping_recipient_name,
        "email": user_email,  # diteruskan secara eksplisit, bukan lazy load
        "mobile": order.shipping_phone,
        "description": f"Pembayaran Pesanan {order.order_number} — Topshop Kosmetik",
        "redirectUrl": f"{settings.FRONTEND_URL.rstrip('/')}/orders/{order.id}",
    }

    async def _request_mayar():
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.post(url, json=payload, headers=headers)
            if r.status_code not in [200, 201]:
                raise HTTPException(status_code=400, detail=f"Mayar payment gateway error: {r.text}")
            res_data = r.json()
            return {
                "id": res_data.get("data", {}).get("id"),
                "payment_url": res_data.get("data", {}).get("link"),
                "amount": float(order.total_amount),
                "status": "pending",
            }

    from app.core.resilience import mayar_breaker, retry_with_backoff

    async def _request_with_retry():
        return await retry_with_backoff(_request_mayar, max_retries=1, base_delay=0.3)

    try:
        return await mayar_breaker.call(func=_request_with_retry)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=503, detail=f"Layanan Mayar Payment Gateway sedang tidak tersedia: {str(e)}")


async def process_mayar_webhook(
    db: AsyncSession,
    payload: Dict[str, Any],
) -> bool:
    """
    Memvalidasi dan memproses callback webhook dari Mayar.
    Mengubah status order menjadi 'paid' dan memicu status invoice.
    """
    event = (payload.get("event") or "").lower()
    data = payload.get("data", {}) if isinstance(payload.get("data"), dict) else payload

    # Kumpulkan semua kemungkinan ID transaksi dari Mayar
    candidate_ids = [
        data.get("id"),
        data.get("paymentLinkId"),
        data.get("payment_link_id"),
        data.get("transaction_id"),
        data.get("transactionId"),
        payload.get("id"),
    ]
    candidate_ids = [str(cid) for cid in candidate_ids if cid]

    if not candidate_ids:
        return False

    stmt = select(Payment).where(Payment.mayar_transaction_id.in_(candidate_ids))
    res = await db.execute(stmt)
    payment = res.scalar_one_or_none()

    if not payment:
        return False

    order_status_mayar = (data.get("status") or "").lower()

    # Cek jika status menunjukkan sukses atau event pembayaran lunas
    is_paid = (
        order_status_mayar in ["paid", "success", "settled"]
        or "paid" in event
        or "success" in event
        or event in ["payment.received", "invoice.paid", "payment.success"]
    )

    if is_paid:
        payment.status = "paid"
        payment.paid_at = datetime.now(timezone.utc)
        payment.raw_response = json.dumps(payload)

        # Update order status
        order_stmt = select(Order).where(Order.id == payment.order_id)
        o_res = await db.execute(order_stmt)
        order = o_res.scalar_one_or_none()
        if order:
            order.status = "paid"

        await db.commit()
        return True

    elif order_status_mayar in ["failed", "expired", "cancelled"]:
        payment.status = order_status_mayar
        await db.commit()
        return True

    return False


async def get_payment_by_order_id(
    db: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Payment:
    """Mengambil rincian pembayaran untuk order milik pengguna."""
    stmt = (
        select(Payment)
        .join(Order, Order.id == Payment.order_id)
        .where(Payment.order_id == order_id, Order.user_id == user_id)
    )
    res = await db.execute(stmt)
    payment = res.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data pembayaran tidak ditemukan")
    return payment


async def verify_and_sync_mayar_payment(
    db: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Payment:
    """
    Mengecek status pembayaran langsung ke Mayar API (Auto-Sync tanpa tergantung Webhook).
    Jika status sudah PAID / SUCCESS di Mayar, otomatis mengupdate database menjadi 'paid'.
    """
    payment = await get_payment_by_order_id(db, order_id, user_id)
    
    # Jika sudah lunas, langsung kembalikan
    if payment.status == "paid":
        return payment

    # Jika sandbox mode / tanpa key
    if not settings.MAYAR_API_KEY or "your_mayar" in settings.MAYAR_API_KEY:
        return payment

    if not payment.mayar_transaction_id or payment.mayar_transaction_id.startswith("PAY-") or payment.mayar_transaction_id.startswith("mayar_test_"):
        return payment

    # Cek ke Mayar API
    url = f"https://api.mayar.id/hl/v1/payment/{payment.mayar_transaction_id}"
    headers = {
        "Authorization": f"Bearer {settings.MAYAR_API_KEY}",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, headers=headers)
            if r.status_code == 200:
                res_data = r.json().get("data", {})
                status_mayar = (res_data.get("status") or "").lower()
                
                if status_mayar in ["paid", "success", "settled"]:
                    payment.status = "paid"
                    payment.paid_at = datetime.now(timezone.utc)
                    payment.raw_response = json.dumps(res_data)

                    order_stmt = select(Order).where(Order.id == order_id)
                    o_res = await db.execute(order_stmt)
                    order = o_res.scalar_one_or_none()
                    if order:
                        order.status = "paid"

                    await db.commit()
                    await db.refresh(payment)
    except Exception:
        # Jika gagal koneksi ke Mayar, kembalikan status saat ini tanpa error 500
        pass

    return payment

