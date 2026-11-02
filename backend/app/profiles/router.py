"""
router.py — Endpoint API Profile Pengguna
Prefix: /api/v1/profile
"""
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.profiles.schemas import ProfileResponse, ProfileUpdate
from app.profiles import service

router = APIRouter()


@router.get(
    "",
    response_model=ProfileResponse,
    summary="Ambil Informasi Profile User",
)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mendapatkan informasi profil pengguna yang sedang login."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_user_profile(db, user_id)


@router.patch(
    "",
    response_model=ProfileResponse,
    summary="Perbarui Informasi Profile User",
)
async def update_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Memperbarui informasi profil pengguna yang sedang login."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.update_user_profile(db, user_id, data)
