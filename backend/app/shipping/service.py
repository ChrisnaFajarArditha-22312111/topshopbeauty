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


def empty_tracking(waybill: str | None, courier: str | None, state: str, message: str) -> Dict[str, Any]:
    """Tidak pernah mengisi status atau riwayat kurir dengan data buatan."""
    return {"tracking_number": waybill, "courier_code": courier,
            "courier_name": courier.upper() if courier else None, "status": None,
            "data_state": state, "message": message, "history": [], "source": "biteship",
            "checked_at": datetime.now(timezone.utc).isoformat()}


def normalize_tracking(payload: Dict[str, Any], waybill: str, courier: str) -> Dict[str, Any]:
    """Batasi respons ke riwayat kurir; alamat/telepon tidak diteruskan ke klien."""
    if payload.get("success") is not True or not isinstance(payload.get("status"), str) or not payload["status"].strip():
        raise ValueError("Respons tracking tidak valid")
    actual_waybill = payload.get("waybill_id")
    actual_courier = payload.get("courier", {}).get("company")
    if not isinstance(actual_waybill, str) or actual_waybill.strip().casefold() != waybill.casefold():
        raise ValueError("Resi provider tidak sesuai permintaan")
    if not isinstance(actual_courier, str) or actual_courier.lower() != courier:
        raise ValueError("Kurir provider tidak sesuai permintaan")
    events = []
    for item in payload.get("history", []):
        if not isinstance(item, dict) or not isinstance(item.get("note"), str):
            continue
        try:
            timestamp = datetime.fromisoformat(item["updated_at"].replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                continue
        except (KeyError, ValueError, TypeError, AttributeError):
            continue
        if not item["note"].strip():
            continue
        events.append({"note": item["note"], "updated_at": timestamp.isoformat(), "status": item.get("status")})
    events.sort(key=lambda row: datetime.fromisoformat(row["updated_at"]), reverse=True)
    result = empty_tracking(waybill, courier, "available", "Data pelacakan diterima dari kurir melalui Biteship.")
    result.update(status=payload["status"], history=events)
    return result


# Cache singkat menghindari request tracking berulang saat halaman dirender ulang.
_tracking_cache: Dict[tuple, tuple] = {}


async def get_tracking_info(tracking_number: str, courier_code: Optional[str] = None, *, use_cache: bool = True) -> Dict[str, Any]:
    """Public Tracking memakai resi+kurir, bukan menganggap resi sebagai tracking_id."""
    import hashlib
    import re
    import time
    from urllib.parse import quote
    from app.core.resilience import retry_with_backoff
    waybill = tracking_number.strip()
    courier = (courier_code or "").strip().lower()
    if not waybill:
        return empty_tracking(None, courier or None, "awaiting_waybill", "Pesanan sedang disiapkan. Nomor resi belum tersedia.")
    if not re.fullmatch(r"[a-z0-9_-]{2,50}", courier):
        return empty_tracking(waybill, None, "unavailable", "Kode kurir belum tersedia atau tidak valid. Hubungi penjual.")
    key = settings.BITESHIP_API_KEY.removeprefix("Bearer ").strip()
    if not key or "your_biteship" in key:
        return empty_tracking(waybill, courier, "unavailable", "Layanan pelacakan belum dikonfigurasi. Hubungi penjual.")
    cache_key = (waybill, courier, hashlib.sha256(key.encode()).hexdigest())
    cached = _tracking_cache.get(cache_key)
    if use_cache and cached and cached[0] > time.monotonic():
        return cached[1]
    url = f"https://api.biteship.com/v1/trackings/{quote(waybill, safe='')}/couriers/{quote(courier, safe='')}"

    async def fetch():
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers={"Authorization": key})
        if response.status_code == 404:
            return empty_tracking(waybill, courier, "not_found", "Resi belum ditemukan oleh kurir. Data mungkin belum tersedia atau resi perlu diperiksa.")
        if response.status_code != 200:
            raise RuntimeError(f"Tracking provider HTTP {response.status_code}")
        return normalize_tracking(response.json(), waybill, courier)

    async def fetch_with_retry():
        return await retry_with_backoff(fetch, max_retries=1, base_delay=0.2)

    try:
        result = await tracking_breaker.call(func=fetch_with_retry)
    except Exception:
        return empty_tracking(waybill, courier, "unavailable", "Layanan kurir sedang tidak dapat diakses. Belum ada data terbaru; silakan coba lagi.")
    if result["data_state"] == "available":
        if len(_tracking_cache) >= 1000:
            _tracking_cache.clear()
        _tracking_cache[cache_key] = (time.monotonic() + 60, result)
    return result


from app.core.resilience import CircuitBreaker
tracking_breaker = CircuitBreaker("biteship_tracking", failure_threshold=3, recovery_timeout=20)


async def get_order_tracking_info(db: AsyncSession, order_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False) -> Dict[str, Any]:
    """Tracking hanya dapat dibaca pemilik pesanan atau admin."""
    from sqlalchemy.orm import selectinload
    stmt = select(Order).options(selectinload(Order.shipment)).where(Order.id == order_id)
    if not is_admin:
        stmt = stmt.where(Order.user_id == user_id)
    order = (await db.execute(stmt)).scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    shipment = order.shipment
    if not shipment or not shipment.tracking_number:
        return empty_tracking(None, shipment.courier_code if shipment else None, "awaiting_waybill", "Pesanan sedang disiapkan. Nomor resi belum tersedia dari penjual.")
    return await get_tracking_info(shipment.tracking_number, shipment.courier_code)


async def process_biteship_webhook(db: AsyncSession, payload: Dict[str, Any]) -> bool:
    """Webhook terautentikasi memicu pengecekan kurir; status payload bukan bukti pengiriman."""
    if payload.get("event") not in {"order.status", "order.waybill_id"}:
        return False
    order_id_biteship = payload.get("order_id")
    waybill = payload.get("courier_waybill_id")
    courier = str(payload.get("courier_company") or "").lower()
    shipment = None
    if order_id_biteship:
        shipment = (await db.execute(select(Shipment).where(Shipment.biteship_order_id == order_id_biteship))).scalar_one_or_none()
    if shipment is None and waybill and courier:
        shipment = (await db.execute(select(Shipment).where(Shipment.tracking_number == waybill, Shipment.courier_code == courier))).scalar_one_or_none()
    if not shipment:
        return False
    effective_waybill = waybill or shipment.tracking_number
    if not effective_waybill:
        return False
    tracking = await get_tracking_info(effective_waybill, shipment.courier_code, use_cache=False)
    if tracking["data_state"] != "available":
        raise HTTPException(status_code=503, detail="Data kurir belum dapat diverifikasi; kirim ulang webhook nanti.")
    order = (await db.execute(select(Order).where(Order.id == shipment.order_id))).scalar_one_or_none()
    if order is None or order.status in {"cancelled", "refunded", "completed"}:
        return False
    # Resi kurir dan tracking_id merupakan identifier yang berbeda.
    shipment.tracking_number = effective_waybill
    shipment.shipping_status = tracking["status"]
    latest = tracking["status"]
    if latest == "delivered":
        order.status = "delivered"
        delivered = next((h for h in tracking["history"] if h.get("status") == "delivered"), None)
        if delivered:
            shipment.delivered_at = datetime.fromisoformat(delivered["updated_at"])
    elif latest in {"picked", "in_transit", "dropping_off", "on_process"} and order.status in {"paid", "processing", "shipped"}:
        order.status = "shipped"
        picked = [h for h in tracking["history"] if h.get("status") == "picked"]
        if picked and shipment.shipped_at is None:
            shipment.shipped_at = datetime.fromisoformat(picked[-1]["updated_at"])
    await db.commit()
    return True
