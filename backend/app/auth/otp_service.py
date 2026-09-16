"""
otp_service.py — Layanan pembuatan dan validasi kode OTP 6-digit
OTP di-hash sebelum disimpan ke database untuk keamanan maksimal
"""
import hashlib
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import EmailVerification
from app.core.email import send_verification_email


def generate_otp_code(length: int = 6) -> str:
    """Generate kode acak angka 6-digit."""
    return "".join(random.choices(string.digits, k=length))


def hash_otp(code: str) -> str:
    """Hash kode OTP menggunakan SHA-256."""
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


async def create_and_send_email_verification(
    db: AsyncSession,
    user_id,
    email: str,
) -> bool:
    """
    Buat kode OTP baru (berlaku 10 menit), simpan hash-nya di DB,
    dan kirimkan via email.
    """
    code = generate_otp_code()
    code_h = hash_otp(code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Simpan record verifikasi baru
    verification = EmailVerification(
        user_id=user_id,
        email=email,
        code_hash=code_h,
        expires_at=expires_at,
        attempt_count=0,
    )
    db.add(verification)
    await db.flush()

    # Log/Print kode OTP agar langsung bisa digunakan saat dev/testing
    print(f"\n=========================================\n🔑 KODE OTP VERIFIKASI: {code}\nUNTUK EMAIL: {email}\nBERLAKU: 10 MENIT\n=========================================\n", flush=True)

    # Kirim email
    return await send_verification_email(to=email, otp=code)


async def verify_email_otp(
    db: AsyncSession,
    email: str,
    code: str,
) -> Tuple[bool, str]:
    """
    Verifikasi kode OTP pengguna.
    Maksimal 5x percobaan, kadaluarsa setelah 10 menit.
    """
    code_h = hash_otp(code)
    now = datetime.now(timezone.utc)

    stmt = (
        select(EmailVerification)
        .where(
            and_(
                EmailVerification.email == email,
                EmailVerification.verified_at.is_(None),
            )
        )
        .order_by(EmailVerification.created_at.desc())
        .limit(1)
    )
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()

    if not record:
        return False, "Tidak ditemukan permintaan verifikasi aktif untuk email ini."

    if record.attempt_count >= 5:
        return False, "Terlalu banyak percobaan gagal. Silakan minta kode verifikasi baru."

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        return False, "Kode verifikasi telah kedaluwarsa. Silakan minta kode baru."

    # Tambah counter percobaan
    record.attempt_count += 1

    if record.code_hash != code_h:
        await db.flush()
        return False, "Kode verifikasi salah."

    # Berhasil diverifikasi
    record.verified_at = now
    await db.flush()
    return True, "Verifikasi email berhasil."
