"""
schemas.py — Pydantic schemas untuk modul autentikasi
Menggunakan Pydantic v2
"""
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Schema input pendaftaran user baru."""
    full_name: str = Field(..., min_length=2, max_length=100, description="Nama lengkap pengguna")
    email: EmailStr = Field(..., description="Alamat email aktif")
    password: str = Field(..., min_length=8, max_length=100, description="Password minimal 8 karakter")
    confirm_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Konfirmasi password tidak cocok dengan password")
        return v


class VerifyEmailRequest(BaseModel):
    """Schema input verifikasi email dengan kode OTP 6-digit."""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$", description="6 digit angka OTP")


class ResendVerificationRequest(BaseModel):
    """Schema input kirim ulang kode verifikasi OTP."""
    email: EmailStr


class LoginRequest(BaseModel):
    """Schema input login email & password."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class ForgotPasswordRequest(BaseModel):
    """Schema input permintaan reset password."""
    email: EmailStr


class VerifyResetCodeRequest(BaseModel):
    """Schema input verifikasi OTP reset password."""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class ResetPasswordRequest(BaseModel):
    """Schema input penetapan password baru setelah verifikasi OTP."""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Konfirmasi password baru tidak cocok")
        return v


class RefreshTokenRequest(BaseModel):
    """Schema input perpanjangan token jwt."""
    refresh_token: str


class GoogleAuthRequest(BaseModel):
    """Schema input token ID dari Google OAuth."""
    id_token: str = Field(..., description="Google JWT ID Token dari frontend")


class TokenResponse(BaseModel):
    """Schema response token JWT setelah login berhasil."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class MessageResponse(BaseModel):
    """Schema response pesan umum."""
    message: str
    detail: Optional[str] = None
