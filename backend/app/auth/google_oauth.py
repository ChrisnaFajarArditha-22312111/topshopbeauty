"""
google_oauth.py — Validasi Google OAuth Token secara aman di backend
Sesuai standar PRD: Backend WAJIB memvalidasi token dari Google
"""
from typing import Optional, Dict, Any
import httpx
from fastapi import HTTPException, status
from app.core.config import settings


async def verify_google_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verifikasi ID Token Google menggunakan endpoint tokeninfo Google.
    Memastikan token ditujukan untuk client ID aplikasi dan belum kedaluwarsa.
    """
    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(url)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="ID Token Google tidak valid atau telah kedaluwarsa",
                )
            payload = response.json()
            
            # Verifikasi audience (Client ID) jika diatur di settings
            if settings.GOOGLE_CLIENT_ID and payload.get("aud") != settings.GOOGLE_CLIENT_ID:
                # Bila client id diset, aud harus cocok
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Google Token audience tidak cocok dengan Client ID aplikasi",
                )

            return {
                "sub": payload.get("sub"), # Google User ID
                "email": payload.get("email"),
                "email_verified": payload.get("email_verified") in [True, "true"],
                "name": payload.get("name") or payload.get("given_name", "Google User"),
                "picture": payload.get("picture"),
            }
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gagal menghubungi server verifikasi Google: {str(e)}",
            )
