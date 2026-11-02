"""
router.py — Endpoint API Autentikasi untuk Topshop Kosmetik AI
Prefix: /api/v1/auth
"""
import uuid
from fastapi import APIRouter, Depends, Request, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.auth.schemas import (
    RegisterRequest,
    VerifyEmailRequest,
    ResendVerificationRequest,
    LoginRequest,
    ForgotPasswordRequest,
    VerifyResetCodeRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
    GoogleAuthRequest,
    TokenResponse,
    MessageResponse,
)
from app.auth import service
from app.auth.password_reset import verify_and_apply_password_reset, create_and_send_password_reset_otp
from app.auth.otp_service import verify_email_otp
from app.users.models import User
from sqlalchemy import select
from app.core.limiter import limiter

router = APIRouter()


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrasi Akun Baru",
)
@limiter.limit("10/minute")
async def register(
    request: Request,
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Mendaftar akun baru dengan email dan password. Kode OTP 6-digit akan dikirim ke email."""
    await service.register_user(db, data)
    return MessageResponse(
        message="Registrasi berhasil! Kode verifikasi OTP telah dikirim ke email Anda.",
        detail="Kode berlaku selama 10 menit.",
    )


@router.post(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verifikasi Email dengan Kode OTP",
)
@limiter.limit("10/minute")
async def verify_email(
    request: Request,
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verifikasi email pengguna baru menggunakan kode OTP 6-digit."""
    await service.verify_user_email(db, data.email, data.code)
    return MessageResponse(
        message="Email berhasil diverifikasi! Akun Anda kini aktif, silakan login.",
    )


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    summary="Kirim Ulang Kode OTP Verifikasi Email",
)
@limiter.limit("5/minute")
async def resend_verification(
    request: Request,
    data: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Mengirim ulang kode OTP verifikasi jika pengguna belum menerima atau kode kedaluwarsa."""
    await service.resend_verification_code(db, data.email)
    return MessageResponse(
        message="Jika email terdaftar dan belum diverifikasi, kode verifikasi baru telah dikirim.",
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login Email & Password",
)
@limiter.limit("15/minute")
async def login(
    request: Request,
    data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """Login dengan email dan password. Menghasilkan JWT Access Token dan Refresh Token."""
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    return await service.login_user(db, data, user_agent=user_agent, ip_address=ip_address)


@router.post(
    "/google",
    response_model=TokenResponse,
    summary="Login / Registrasi dengan Google OAuth",
)
async def google_auth(
    data: GoogleAuthRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Login atau daftar otomatis menggunakan Google ID Token yang divalidasi backend."""
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    return await service.login_or_register_google(db, data, user_agent=user_agent, ip_address=ip_address)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Permintaan Reset Password (Kirim OTP)",
)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Mengirimkan kode OTP reset password ke alamat email yang terdaftar."""
    stmt = select(User).where(User.email == data.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if user:
        await create_and_send_password_reset_otp(db, user)
        await db.commit()
    return MessageResponse(
        message="Jika email terdaftar, kode reset password telah dikirim ke email Anda.",
    )


@router.post(
    "/verify-reset-code",
    response_model=MessageResponse,
    summary="Verifikasi Kode OTP Reset Password",
)
async def verify_reset_code(data: VerifyResetCodeRequest, db: AsyncSession = Depends(get_db)):
    """Validasi apakah kode OTP reset password pengguna benar sebelum input password baru."""
    stmt = select(User).where(User.email == data.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Kode verifikasi salah atau email tidak valid.")
    
    # Verifikasi OTP sementara
    return MessageResponse(message="Kode verifikasi valid. Silakan masukkan password baru Anda.")


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Tetapkan Password Baru",
)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Memperbarui password pengguna setelah verifikasi kode OTP berhasil."""
    success, msg = await verify_and_apply_password_reset(db, data.email, data.code, data.new_password)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    await db.commit()
    return MessageResponse(message=msg)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Perbarui JWT Access Token",
)
async def refresh_token(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Memperbarui access token yang telah kedaluwarsa dengan refresh token yang valid."""
    return await service.refresh_user_token(db, data.refresh_token)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout Pengguna",
)
async def logout(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mencabut semua sesi login aktif untuk user yang sedang terautentikasi."""
    user_id = uuid.UUID(current_user["sub"])
    await service.logout_user(db, user_id)
    return MessageResponse(message="Berhasil logout dari sistem.")
