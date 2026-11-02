"""
service.py — Business logic pengelolaan alamat pengguna
Mendukung multiple alamat dan pengaturan alamat utama (is_default)
"""
import uuid
from typing import List
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.addresses.models import UserAddress
from app.addresses.schemas import AddressCreate, AddressUpdate


async def get_user_addresses(db: AsyncSession, user_id: uuid.UUID) -> List[UserAddress]:
    """Mengambil semua daftar alamat milik user."""
    stmt = (
        select(UserAddress)
        .where(UserAddress.user_id == user_id)
        .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc())
    )
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def get_address_by_id(db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID) -> UserAddress:
    """Mengambil detail satu alamat spesifik milik user."""
    stmt = select(UserAddress).where(UserAddress.id == address_id, UserAddress.user_id == user_id)
    res = await db.execute(stmt)
    addr = res.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alamat tidak ditemukan")
    return addr


async def create_address(db: AsyncSession, user_id: uuid.UUID, data: AddressCreate) -> UserAddress:
    """Menambahkan alamat baru untuk pengguna."""
    # Jika ditandai default, reset alamat default lama
    if data.is_default:
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == user_id)
            .values(is_default=False)
        )

    # Cek jika ini adalah alamat pertama kali yang dibuat, otomatis default
    count_stmt = select(UserAddress).where(UserAddress.user_id == user_id)
    c_res = await db.execute(count_stmt)
    existing_first = c_res.first()
    is_def = data.is_default or (existing_first is None)

    new_addr = UserAddress(
        user_id=user_id,
        label=data.label,
        recipient_name=data.recipient_name,
        phone=data.phone,
        address=data.address,
        province=data.province,
        city=data.city,
        district=data.district,
        postal_code=data.postal_code,
        is_default=is_def,
    )
    db.add(new_addr)
    await db.commit()
    await db.refresh(new_addr)
    return new_addr


async def update_address(
    db: AsyncSession,
    user_id: uuid.UUID,
    address_id: uuid.UUID,
    data: AddressUpdate,
) -> UserAddress:
    """Memperbarui informasi alamat."""
    addr = await get_address_by_id(db, user_id, address_id)

    if data.is_default is True:
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == user_id)
            .values(is_default=False)
        )

    update_dict = data.model_dump(exclude_unset=True)
    for field, val in update_dict.items():
        setattr(addr, field, val)

    await db.commit()
    await db.refresh(addr)
    return addr


async def set_default_address(db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID) -> UserAddress:
    """Menjadikan alamat terpilih sebagai alamat utama (default)."""
    addr = await get_address_by_id(db, user_id, address_id)

    await db.execute(
        update(UserAddress)
        .where(UserAddress.user_id == user_id)
        .values(is_default=False)
    )
    addr.is_default = True
    await db.commit()
    await db.refresh(addr)
    return addr


async def delete_address(db: AsyncSession, user_id: uuid.UUID, address_id: uuid.UUID) -> None:
    """Menghapus alamat milik user."""
    addr = await get_address_by_id(db, user_id, address_id)
    await db.delete(addr)
    await db.commit()
