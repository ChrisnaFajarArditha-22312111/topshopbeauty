"""
router.py — Endpoint API Alamat Pengguna
Prefix: /api/v1/addresses
"""
import uuid
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.addresses.schemas import AddressCreate, AddressUpdate, AddressResponse
from app.addresses import service
from app.auth.schemas import MessageResponse

router = APIRouter()


@router.get(
    "",
    response_model=List[AddressResponse],
    summary="Daftar Alamat Pengguna",
)
async def list_addresses(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mendapatkan seluruh daftar alamat pengiriman milik user."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_user_addresses(db, user_id)


@router.post(
    "",
    response_model=AddressResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tambah Alamat Baru",
)
async def create_address(
    data: AddressCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menambahkan alamat pengiriman baru untuk user."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.create_address(db, user_id, data)


@router.get(
    "/{address_id}",
    response_model=AddressResponse,
    summary="Detail Alamat",
)
async def get_address(
    address_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Melihat detail satu alamat pengiriman."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.get_address_by_id(db, user_id, address_id)


@router.patch(
    "/{address_id}",
    response_model=AddressResponse,
    summary="Update Alamat",
)
async def update_address(
    address_id: uuid.UUID,
    data: AddressUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mengubah data alamat pengiriman."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.update_address(db, user_id, address_id, data)


@router.patch(
    "/{address_id}/default",
    response_model=AddressResponse,
    summary="Set Alamat Utama",
)
async def set_default_address(
    address_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menetapkan alamat terpilih menjadi alamat utama pengiriman."""
    user_id = uuid.UUID(current_user["sub"])
    return await service.set_default_address(db, user_id, address_id)


@router.delete(
    "/{address_id}",
    response_model=MessageResponse,
    summary="Hapus Alamat",
)
async def delete_address(
    address_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Menghapus alamat pengiriman."""
    user_id = uuid.UUID(current_user["sub"])
    await service.delete_address(db, user_id, address_id)
    return MessageResponse(message="Alamat berhasil dihapus.")
