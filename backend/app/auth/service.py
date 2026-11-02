"""
service.py — Business logic autentikasi untuk Topshop Kosmetik AI
Mengelola registrasi, login email, Google login, session, refresh token, logout
"""
import uuid
from typing import Tuple, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.users.models import User, OAuthAccount, UserSession
from app.profiles.models import Profile
from app.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    GoogleAuthRequest,
)
from app.auth.otp_service import create_and_send_email_verification, verify_email_otp, hash_otp
from app.auth.password_reset import create_and_send_password_reset_otp, verify_and_apply_password_reset
from app.auth.google_oauth import verify_google_id_token
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.core.config import settings


async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    """Registrasi pengguna baru dan kirim kode OTP verifikasi email."""
    # Cek apakah email sudah terdaftar
    stmt = select(User).where(User.email == data.email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar. Silakan gunakan email lain atau login.",
        )

    # Buat User baru (email_verified = False)
    new_user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        email_verified=False,
        is_active=True,
    )
    db.add(new_user)
    await db.flush()

    # Buat Profil awal pengguna
    new_profile = Profile(
        user_id=new_user.id,
        full_name=data.full_name,
    )
    db.add(new_profile)
    await db.flush()

    # Generate dan kirim OTP verifikasi email
    await create_and_send_email_verification(db, new_user.id, new_user.email)
    await db.commit()

    return new_user


async def verify_user_email(db: AsyncSession, email: str, code: str) -> None:
    """Verifikasi email menggunakan OTP 6 digit."""
    success, msg = await verify_email_otp(db, email, code)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Update status user menjadi email_verified = True
    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if user:
        user.email_verified = True
        await db.commit()


async def resend_verification_code(db: AsyncSession, email: str) -> None:
    """Kirim ulang kode OTP verifikasi jika akun belum terverifikasi."""
    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        # Untuk keamanan, jangan bocorkan jika email tidak terdaftar
        return

    if user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ini sudah terverifikasi sebelumnya. Silakan langsung login.",
        )

    await create_and_send_email_verification(db, user.id, user.email)
    await db.commit()


async def login_user(
    db: AsyncSession,
    data: LoginRequest,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> TokenResponse:
    """Login dengan email dan password, mengembalikan JWT tokens."""
    stmt = select(User).where(User.email == data.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda dinonaktifkan. Silakan hubungi admin.",
        )

    # Validasi email_verified
    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email belum diverifikasi. Silakan verifikasi email terlebih dahulu.",
        )

    # Generate JWT
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "is_admin": user.is_admin,
    }
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    # Simpan sesi login
    session_record = UserSession(
        user_id=user.id,
        refresh_token_hash=hash_otp(refresh_token),
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(session_record)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def login_or_register_google(
    db: AsyncSession,
    data: GoogleAuthRequest,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> TokenResponse:
    """
    Login atau pendaftaran otomatis via Google OAuth Token.
    Memverifikasi token Google di backend secara ketat.
    """
    google_info = await verify_google_id_token(data.id_token)
    email = google_info["email"]
    google_id = google_info["sub"]
    name = google_info["name"]
    avatar = google_info.get("picture")

    # Cari user berdasarkan email
    stmt = select(User).where(User.email == email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        # Buat akun baru via Google
        user = User(
            email=email,
            password_hash=None,
            email_verified=True,  # Akun Google yang terverifikasi dianggap valid
            is_active=True,
        )
        db.add(user)
        await db.flush()

        profile = Profile(
            user_id=user.id,
            full_name=name,
            avatar_url=avatar,
        )
        db.add(profile)

        oauth_acc = OAuthAccount(
            user_id=user.id,
            provider="google",
            provider_account_id=google_id,
        )
        db.add(oauth_acc)
    else:
        # Cek apakah oauth_account sudah terhubung
        oauth_stmt = select(OAuthAccount).where(
            OAuthAccount.user_id == user.id,
            OAuthAccount.provider == "google",
        )
        oa_res = await db.execute(oauth_stmt)
        if not oa_res.scalar_one_or_none():
            oauth_acc = OAuthAccount(
                user_id=user.id,
                provider="google",
                provider_account_id=google_id,
            )
            db.add(oauth_acc)
        # Jika akun google terverifikasi, pastikan status email_verified aktif
        if google_info.get("email_verified") and not user.email_verified:
            user.email_verified = True

    await db.flush()

    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "is_admin": user.is_admin,
    }
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    session_record = UserSession(
        user_id=user.id,
        refresh_token_hash=hash_otp(refresh_token),
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(session_record)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def refresh_user_token(db: AsyncSession, refresh_token: str) -> TokenResponse:
    """Perbarui access token dengan validasi refresh token."""
    payload = verify_token(refresh_token, token_type="refresh")
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")

    user_id = uuid.UUID(user_id_str)
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User tidak aktif atau tidak ditemukan")

    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "is_admin": user.is_admin,
    }
    new_access_token = create_access_token(token_payload)
    new_refresh_token = create_refresh_token(token_payload)

    # Invalidate token lama, buat sesi baru
    token_h = hash_otp(refresh_token)
    session_stmt = select(UserSession).where(
        UserSession.user_id == user.id,
        UserSession.refresh_token_hash == token_h,
        UserSession.is_revoked.is_(False),
    )
    s_res = await db.execute(session_stmt)
    active_session = s_res.scalar_one_or_none()
    if active_session:
        active_session.is_revoked = True

    new_session = UserSession(
        user_id=user.id,
        refresh_token_hash=hash_otp(new_refresh_token),
    )
    db.add(new_session)
    await db.commit()

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def logout_user(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Revoke semua sesi login aktif user."""
    stmt = select(UserSession).where(
        UserSession.user_id == user_id,
        UserSession.is_revoked.is_(False),
    )
    res = await db.execute(stmt)
    sessions = res.scalars().all()
    for s in sessions:
        s.is_revoked = True
    await db.commit()
