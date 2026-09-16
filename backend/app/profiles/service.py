"""
service.py — Business logic profile pengguna
"""
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.profiles.models import Profile
from app.users.models import User
from app.profiles.schemas import ProfileUpdate, ProfileResponse


async def get_user_profile(db: AsyncSession, user_id: uuid.UUID) -> ProfileResponse:
    """Mengambil data profile pengguna berdasarkan user_id."""
    stmt = select(Profile, User.email).join(User, User.id == Profile.user_id).where(Profile.user_id == user_id)
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile tidak ditemukan")
    
    profile, email = row
    resp = ProfileResponse.model_validate(profile)
    resp.email = email
    return resp


async def update_user_profile(db: AsyncSession, user_id: uuid.UUID, data: ProfileUpdate) -> ProfileResponse:
    """Memperbarui informasi profil pengguna."""
    stmt = select(Profile, User.email).join(User, User.id == Profile.user_id).where(Profile.user_id == user_id)
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile tidak ditemukan")

    profile, email = row
    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(profile, field, val)

    await db.commit()
    await db.refresh(profile)

    resp = ProfileResponse.model_validate(profile)
    resp.email = email
    return resp
