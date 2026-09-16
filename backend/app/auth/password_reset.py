"""
password_reset.py — Layanan untuk alur reset password
Generate OTP reset, validasi OTP, dan update password baru
"""
from datetime import datetime, timedelta, timezone
from typing import Tuple
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import PasswordResetToken
from app.auth.otp_service import generate_otp_code, hash_otp
from app.core.email import send_password_reset_email
from app.core.security import hash_password
from app.users.models import User


async def create_and_send_password_reset_otp(
    db: AsyncSession,
    user: User,
) -> bool:
    """
    Buat OTP 6-digit untuk reset password (berlaku 10 menit),
    simpan token hash di DB, dan kirimkan ke email.
    """
    code = generate_otp_code()
    code_h = hash_otp(code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    token_record = PasswordResetToken(
        user_id=user.id,
        token_hash=code_h,
        expires_at=expires_at,
    )
    db.add(token_record)
    await db.flush()

    # Log/Print kode OTP reset password agar bisa dilihat di log terminal
    print(f"\n=========================================\n🔑 KODE OTP RESET PASSWORD: {code}\nUNTUK EMAIL: {user.email}\nBERLAKU: 10 MENIT\n=========================================\n", flush=True)

    return await send_password_reset_email(to=user.email, otp=code)


async def verify_and_apply_password_reset(
    db: AsyncSession,
    email: str,
    code: str,
    new_password: str,
) -> Tuple[bool, str]:
    """
    Validasi OTP reset password dan perbarui password user.
    """
    # Cari user
    user_stmt = select(User).where(User.email == email)
    res = await db.execute(user_stmt)
    user = res.scalar_one_or_none()
    if not user:
        return False, "Akun dengan email tersebut tidak ditemukan."

    code_h = hash_otp(code)
    now = datetime.now(timezone.utc)

    # Cari token reset aktif terakhir
    stmt = (
        select(PasswordResetToken)
        .where(
            and_(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used_at.is_(None),
            )
        )
        .order_by(PasswordResetToken.created_at.desc())
        .limit(1)
    )
    t_res = await db.execute(stmt)
    record = t_res.scalar_one_or_none()

    if not record:
        return False, "Tidak ada permintaan reset password yang valid."

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        return False, "Kode reset password telah kedaluwarsa."

    if record.token_hash != code_h:
        return False, "Kode verifikasi reset password salah."

    # Tandai token telah digunakan
    record.used_at = now

    # Update password user dengan hash aman
    user.password_hash = hash_password(new_password)
    await db.flush()

    return True, "Password berhasil diperbarui. Silakan login dengan password baru."
