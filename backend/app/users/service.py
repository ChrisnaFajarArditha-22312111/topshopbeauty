"""
service.py — Business logic user management
"""
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.users.models import User
from app.users.schemas import ChangePasswordRequest
from app.core.security import verify_password, hash_password


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
    """Mengambil model User berdasarkan ID."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User tidak ditemukan")
    return user


async def change_user_password(db: AsyncSession, user_id: uuid.UUID, data: ChangePasswordRequest) -> None:
    """Mengubah password pengguna yang sedang login."""
    user = await get_user_by_id(db, user_id)
    if not user.password_hash or not verify_password(data.old_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password lama salah")

    user.password_hash = hash_password(data.new_password)
    await db.commit()
