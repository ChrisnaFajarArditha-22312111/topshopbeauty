"""
idempotency.py — Idempotency Key Management berbasis PostgreSQL
Mencegah eksekusi ganda pada operasi sensitif (checkout, payment, webhook callback).

Komponen:
1. Model IdempotencyKeyRecord di PostgreSQL.
2. check_or_start_idempotency: verifikasi status request (processing, completed, atau failed).
3. complete_idempotency: simpan payload respon agar request berikutnya dengan key yang sama dapat langsung mengembalikan respon cache.
4. fail_idempotency: jika ada unhandled error, ubah status ke failed atau hapus agar user dapat mengulang.
"""
import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, Optional, Tuple, Union

from fastapi import HTTPException, status
from sqlalchemy import String, Integer, DateTime, Text, Uuid, select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

logger = logging.getLogger(__name__)

UUID_TYPE = Uuid(as_uuid=True)


class IdempotencyKeyRecord(Base):
    """
    Tabel PostgreSQL untuk menyimpan status request yang memiliki header Idempotency-Key.
    """
    __tablename__ = "idempotency_keys"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        primary_key=True,
        default=uuid.uuid4,
    )
    key: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        index=True,
        nullable=False,
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID_TYPE,
        nullable=True,
        index=True,
    )
    request_path: Mapped[str] = mapped_column(String(255), nullable=False)
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default="processing",
        nullable=False,
    )  # "processing" | "completed" | "failed"
    response_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )


def compute_request_hash(data: Any) -> str:
    """Menghitung SHA-256 hash dari data request payload untuk deteksi perubahan parameter."""
    if data is None:
        raw = b""
    elif isinstance(data, (dict, list)):
        raw = json.dumps(data, sort_keys=True, default=str).encode("utf-8")
    elif hasattr(data, "model_dump"):
        raw = json.dumps(data.model_dump(), sort_keys=True, default=str).encode("utf-8")
    elif hasattr(data, "dict"):
        raw = json.dumps(data.dict(), sort_keys=True, default=str).encode("utf-8")
    elif isinstance(data, str):
        raw = data.encode("utf-8")
    else:
        raw = str(data).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


async def check_or_start_idempotency(
    db: AsyncSession,
    key: str,
    request_path: str,
    payload: Any,
    user_id: Optional[uuid.UUID] = None,
    ttl_seconds: int = 86400,  # 24 jam default
) -> Tuple[bool, Optional[int], Optional[Dict[str, Any]]]:
    """
    Mengecek apakah idempotency key sudah pernah diproses.
    Mengembalikan tuple: (is_cache_hit: bool, status_code: Optional[int], cached_response: Optional[dict])

    Aturan:
    1. Jika record ditemukan dan status = 'completed':
       - Jika hash payload berbeda -> HTTP 422 Unprocessable Entity
       - Jika hash payload sama -> kembalikan respon tersimpan (Cache hit!)
    2. Jika record ditemukan dan status = 'processing':
       - Jika belum expire -> HTTP 409 Conflict (request sedang berjalan)
       - Jika sudah expire (stale) -> perbarui untuk retry
    3. Jika record belum ada:
       - Buat record baru dengan status 'processing'
       - Lanjutkan eksekusi (Cache miss)
    """
    now = datetime.now(timezone.utc)
    curr_hash = compute_request_hash(payload)

    stmt = select(IdempotencyKeyRecord).where(IdempotencyKeyRecord.key == key)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    if record:
        # Cek apakah record sudah kedaluwarsa
        expires_at = record.expires_at
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at and now > expires_at:
            logger.info(f"⏳ Idempotency key '{key}' kedaluwarsa. Menghapus record lama.")
            await db.delete(record)
            await db.commit()
            record = None
        else:
            # Validasi kesesuaian hash payload
            if record.request_hash != curr_hash:
                logger.warning(
                    f"⛔ Idempotency key '{key}' digunakan ulang dengan payload yang berbeda!"
                )
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Idempotency-Key reuse dengan request payload yang berbeda tidak diperbolehkan.",
                )

            if record.status == "processing":
                logger.warning(f"🔒 Idempotency key '{key}' sedang dalam proses pemrosesan.")
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Permintaan dengan Idempotency-Key ini sedang diproses. Mohon tunggu beberapa saat.",
                )

            if record.status == "completed":
                logger.info(f"🎯 Idempotency key '{key}' HIT! Mengembalikan respon tersimpan.")
                cached_data = json.loads(record.response_body) if record.response_body else {}
                return True, record.response_code or 200, cached_data

            # Jika status 'failed', izinkan retry dengan me-reset record
            logger.info(f"🔄 Idempotency key '{key}' sebelumnya berstatus failed. Mencoba ulang.")
            record.status = "processing"
            record.request_hash = curr_hash
            record.created_at = now
            record.expires_at = now + timedelta(seconds=ttl_seconds)
            await db.commit()
            return False, None, None

    # Buat record baru (status: processing)
    new_record = IdempotencyKeyRecord(
        key=key,
        user_id=user_id,
        request_path=request_path,
        request_hash=curr_hash,
        status="processing",
        expires_at=now + timedelta(seconds=ttl_seconds),
    )
    db.add(new_record)
    await db.commit()
    logger.info(f"📝 Idempotency key '{key}' dicatat dengan status 'processing'.")
    return False, None, None


async def complete_idempotency(
    db: AsyncSession,
    key: str,
    response_code: int,
    response_data: Any,
):
    """Menyimpan hasil eksekusi request dan mengubah status menjadi 'completed'."""
    stmt = select(IdempotencyKeyRecord).where(IdempotencyKeyRecord.key == key)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()
    if record:
        record.status = "completed"
        record.response_code = response_code
        if hasattr(response_data, "model_dump"):
            body_str = json.dumps(response_data.model_dump(), default=str)
        elif hasattr(response_data, "dict"):
            body_str = json.dumps(response_data.dict(), default=str)
        elif isinstance(response_data, (dict, list)):
            body_str = json.dumps(response_data, default=str)
        else:
            body_str = str(response_data)
        record.response_body = body_str
        await db.commit()
        logger.info(f"✅ Idempotency key '{key}' berhasil disimpan dengan status 'completed'.")


async def fail_idempotency(db: AsyncSession, key: str):
    """Menandai idempotency key sebagai gagal jika terjadi error tak terduga."""
    stmt = select(IdempotencyKeyRecord).where(IdempotencyKeyRecord.key == key)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()
    if record:
        record.status = "failed"
        await db.commit()
        logger.warning(f"❌ Idempotency key '{key}' diubah menjadi status 'failed'.")
