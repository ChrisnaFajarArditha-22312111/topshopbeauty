"""
service.py — Layanan integrasi Pengiriman Biteship
Menghitung ongkir, memilih kurir, tracking paket, dan memproses webhook pengiriman
"""
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.core.config import settings
from app.orders.models import Order, Shipment
from app.orders.schemas import CourierOptionResponse, BiteshipWebhookPayload


# Data kurir default saat dev/sandbox
MOCK_COURIER_RATES = [
    CourierOptionResponse(courier_code="jne", courier_name="JNE Express", service_code="reg", service_name="JNE Reguler", price=15000.0, etd="1-2 hari"),
    CourierOptionResponse(courier_code="sicepat", courier_name="SiCepat Express", service_code="sicepat_reg", service_name="SiCepat Reguler", price=14000.0, etd="1-2 hari"),
    CourierOptionResponse(courier_code="jnt", courier_name="J&T Express", service_code="ez", service_name="J&T Reguler", price=16000.0, etd="1-3 hari"),
]


async def calculate_biteship_rates(
    destination_postal_code: str,
    courier_code: Optional[str] = None,
    weight_grams: int = 500,
) -> List[CourierOptionResponse]:
    """
    Menghitung tarif ongkos kirim ke alamat tujuan via Biteship API.
    Jika API key belum diset, mengembalikan rate mock yang realistis.
    """
    if not settings.BITESHIP_API_KEY or "your_biteship" in settings.BITESHIP_API_KEY:
        if courier_code:
            return [c for c in MOCK_COURIER_RATES if c.courier_code.lower() == courier_code.lower()] or MOCK_COURIER_RATES
        return MOCK_COURIER_RATES

    url = "https://api.biteship.com/v1/rates/couriers"
    headers = {
        "Authorization": f"Bearer {settings.BITESHIP_API_KEY}",
        "Content-Type": "application/json",
    }
    # Origin Topshop Kosmetik Bandar Lampung (Postal Code: 35111)
    payload = {
        "origin_postal_code": 35111,
        "destination_postal_code": int(destination_postal_code),
        "couriers": courier_code or "jne,sicepat,jnt",
        "items": [{"name": "Paket Kosmetik Topshop", "value": 50000, "weight": weight_grams, "quantity": 1}],
    }

    async def _fetch_rates():
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(url, json=payload, headers=headers)
            if r.status_code != 200:
                return MOCK_COURIER_RATES
            pricing = r.json().get("pricing", [])
            results = []
            for p in pricing:
                results.append(
                    CourierOptionResponse(
                        courier_code=p.get("courier_company"),
                        courier_name=p.get("courier_name"),
                        service_code=p.get("courier_service_code"),
                        service_name=p.get("courier_service_name"),
                        price=float(p.get("price", 15000)),
                        etd=p.get("shipment_duration_range", "1-2 hari"),
                    )
                )
            return results or MOCK_COURIER_RATES

    from app.core.resilience import biteship_breaker, retry_with_backoff

    async def _fetch_with_retry():
        return await retry_with_backoff(_fetch_rates, max_retries=1, base_delay=0.2)

    try:
        return await biteship_breaker.call(
            func=_fetch_with_retry,
            fallback=lambda: MOCK_COURIER_RATES,
        )
    except Exception:
        return MOCK_COURIER_RATES


async def get_tracking_info(tracking_number: str) -> Dict[str, Any]:
    """
    Mengambil status pelacakan pengiriman kurir melalui Biteship API.
    Dilindungi dengan Circuit Breaker dan Graceful Fallback.
    """
    fallback_tracking = {
        "tracking_number": tracking_number,
        "status": "in_transit",
        "history": [
            {"note": "Pesanan diterima oleh kurir", "updated_at": datetime.now(timezone.utc).isoformat()},
            {"note": "Paket dalam perjalanan ke kota tujuan", "updated_at": datetime.now(timezone.utc).isoformat()},
        ],
    }

    if not settings.BITESHIP_API_KEY or "your_biteship" in settings.BITESHIP_API_KEY:
        return fallback_tracking

    url = f"https://api.biteship.com/v1/trackings/{tracking_number}"
    headers = {
        "Authorization": f"Bearer {settings.BITESHIP_API_KEY}",
    }

    async def _fetch_tracking():
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(url, headers=headers)
            if r.status_code == 200:
                return r.json()
            return {"tracking_number": tracking_number, "status": "unknown"}

    from app.core.resilience import biteship_breaker, retry_with_backoff

    async def _track_with_retry():
        return await retry_with_backoff(_fetch_tracking, max_retries=1, base_delay=0.2)

    try:
        return await biteship_breaker.call(
            func=_track_with_retry,
            fallback=lambda: fallback_tracking,
        )
    except Exception:
        return fallback_tracking


async def process_biteship_webhook(db: AsyncSession, payload: Dict[str, Any]) -> bool:
    """
    Memproses webhook status live tracking dari Biteship.
    Mengupdate status Shipment dan Order (contoh: status 'delivered' merubah Order menjadi 'completed').
    """
    order_id_biteship = payload.get("order_id")
    tracking_id = payload.get("courier_tracking_id") or payload.get("tracking_id")
    status_biteship = (payload.get("status") or "").lower()

    if not order_id_biteship and not tracking_id:
        return False

    stmt = select(Shipment)
    if order_id_biteship:
        stmt = stmt.where(Shipment.biteship_order_id == order_id_biteship)
    elif tracking_id:
        stmt = stmt.where(Shipment.tracking_number == tracking_id)

    res = await db.execute(stmt)
    shipment = res.scalar_one_or_none()
    if not shipment:
        return False

    shipment.shipping_status = status_biteship

    # Update Order status berdasarkan webhook pengiriman
    order_stmt = select(Order).where(Order.id == shipment.order_id)
    o_res = await db.execute(order_stmt)
    order = o_res.scalar_one_or_none()

    if order:
        if status_biteship in ["picking_up", "dropping_off", "in_transit", "on_process"]:
            order.status = "shipped"
            if not shipment.shipped_at:
                shipment.shipped_at = datetime.now(timezone.utc)
        elif status_biteship in ["delivered", "completed"]:
            order.status = "completed"
            if not shipment.delivered_at:
                shipment.delivered_at = datetime.now(timezone.utc)

    await db.commit()
    return True
