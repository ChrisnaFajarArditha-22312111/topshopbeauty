"""
security.py — Utilitas keamanan untuk Topshop Kosmetik AI
Menangani: hashing password, JWT token, dan dependency autentikasi
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# =========================================================
# Konfigurasi Password Hashing
# Gunakan bcrypt sebagai algoritma utama
# =========================================================
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Cost factor bcrypt — sesuaikan dengan performa server
)

# =========================================================
# Bearer Token untuk autentikasi HTTP
# =========================================================
bearer_scheme = HTTPBearer(auto_error=False)


# =========================================================
# Fungsi Hashing Password
# =========================================================
def hash_password(password: str) -> str:
    """
    Hash password menggunakan bcrypt.
    Password TIDAK BOLEH disimpan dalam bentuk plaintext.

    Args:
        password: Password plaintext dari pengguna

    Returns:
        String hash password yang aman untuk disimpan ke database
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifikasi password plaintext terhadap hash yang tersimpan.

    Args:
        plain_password: Password plaintext dari pengguna saat login
        hashed_password: Hash password yang tersimpan di database

    Returns:
        True jika password cocok, False jika tidak
    """
    return pwd_context.verify(plain_password, hashed_password)


# =========================================================
# Fungsi JWT Token
# =========================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Buat JWT access token dengan waktu kedaluwarsa pendek.

    Args:
        data: Payload yang akan dimasukkan ke dalam token (biasanya {"sub": user_id})
        expires_delta: Durasi kedaluwarsa kustom (opsional)

    Returns:
        String JWT access token yang sudah di-encode
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({
        "exp": expire,
        "type": "access",
        "iat": datetime.now(timezone.utc),
    })

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Buat JWT refresh token dengan waktu kedaluwarsa panjang.
    Digunakan untuk memperbarui access token tanpa login ulang.

    Args:
        data: Payload yang akan dimasukkan ke dalam token
        expires_delta: Durasi kedaluwarsa kustom (opsional)

    Returns:
        String JWT refresh token yang sudah di-encode
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
    })

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def verify_token(token: str, token_type: str = "access") -> dict:
    """
    Verifikasi dan decode JWT token.

    Args:
        token: JWT token string yang akan diverifikasi
        token_type: Tipe token yang diharapkan ("access" atau "refresh")

    Returns:
        Payload token jika valid

    Raises:
        HTTPException 401 jika token tidak valid atau kedaluwarsa
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau telah kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )

        # Verifikasi tipe token
        if payload.get("type") != token_type:
            raise credentials_exception

        # Pastikan subject (user_id) ada di payload
        user_id: Any = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        return payload

    except JWTError:
        raise credentials_exception


# =========================================================
# Dependency FastAPI — Ambil current user
# =========================================================
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Dependency FastAPI untuk mendapatkan user yang sedang login.
    Ekstrak dan verifikasi JWT dari header Authorization: Bearer <token>.

    Args:
        credentials: Bearer token dari header HTTP

    Returns:
        Payload JWT yang berisi informasi user

    Raises:
        HTTPException 401 jika token tidak ada atau tidak valid

    Penggunaan:
        @router.get("/protected")
        async def protected_route(current_user: dict = Depends(get_current_user)):
            user_id = current_user["sub"]
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token autentikasi diperlukan",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_token(credentials.credentials, token_type="access")


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[dict]:
    """
    Dependency opsional — tidak wajib login.
    Kembalikan payload jika ada token valid, None jika tidak ada.

    Penggunaan:
        @router.get("/public")
        async def public_route(current_user = Depends(get_current_user_optional)):
            if current_user:
                # User sedang login
                ...
    """
    if credentials is None:
        return None

    try:
        return verify_token(credentials.credentials, token_type="access")
    except HTTPException:
        return None


async def require_admin(
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Dependency FastAPI untuk otorisasi Role-Based Access Control (RBAC).
    Memverifikasi apakah pengguna yang terautentikasi memiliki peran admin (is_admin=True).
    """
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak. Endpoint ini hanya dapat diakses oleh Administrator.",
        )
    return current_user

