"""
router.py — Endpoint API Voucher & Promosi
Prefix: /api/v1/promotions
"""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.promotions.schemas import (
    VoucherResponse,
    ValidateVoucherRequest,
    ValidateVoucherResponse,
)
from app.promotions import service

router = APIRouter()


@router.get("/vouchers", response_model=List[VoucherResponse], summary="Daftar Voucher Aktif")
async def list_vouchers(
    db: AsyncSession = Depends(get_db),
):
    """Melihat daftar seluruh voucher diskon yang sedang berlaku."""
    return await service.get_active_vouchers(db)


@router.post("/validate", response_model=ValidateVoucherResponse, summary="Validasi Kode Voucher")
async def validate_voucher(
    data: ValidateVoucherRequest,
    db: AsyncSession = Depends(get_db),
):
    """Cek keabsahan kode voucher dan hitung estimasi potongan harga diskon."""
    return await service.validate_voucher_code(db, data.code, data.subtotal)
