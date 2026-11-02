"""
router.py — Endpoint API User Management
Prefix: /api/v1/users
"""
import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.users.schemas import UserResponse, ChangePasswordRequest
from app.users import service
from app.auth.schemas import MessageResponse

router = APIRouter()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Data Akun Saya",
)
async def get_me(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat informasi akun user yang sedang login."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_user_by_id(db, user_id)


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Ubah Password",
)
async def change_password(
    data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengganti password akun user saat sedang login."""
    user_id = uuid.UUID(current_user["sub"])
    await service.change_user_password(db, user_id, data)
    return MessageResponse(message="Password berhasil diperbarui.")
