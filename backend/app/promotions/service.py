"""
service.py — Business logic Voucher dan Promosi Diskon
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.promotions.models import Voucher
from app.promotions.schemas import (
    VoucherResponse,
    ValidateVoucherRequest,
    ValidateVoucherResponse,
    CreateVoucherRequest,
)


async def get_active_vouchers(db: AsyncSession) -> List[VoucherResponse]:
    """Mengambil daftar voucher promosi yang sedang aktif."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(Voucher)
        .where(
            and_(
                Voucher.is_active.is_(True),
                Voucher.start_date <= now,
                Voucher.end_date >= now,
                Voucher.used_count < Voucher.usage_limit,
            )
        )
        .order_by(Voucher.created_at.desc())
    )
    res = await db.execute(stmt)
    vouchers = res.scalars().all()
    return [
        VoucherResponse(
            id=v.id,
            code=v.code,
            name=v.name,
            description=v.description,
            discount_type=v.discount_type,
            discount_amount=float(v.discount_amount),
            min_purchase=float(v.min_purchase),
            max_discount=float(v.max_discount) if v.max_discount else None,
            usage_limit=v.usage_limit,
            used_count=v.used_count,
            start_date=v.start_date,
            end_date=v.end_date,
            is_active=v.is_active,
        )
        for v in vouchers
    ]


async def validate_voucher_code(
    db: AsyncSession,
    code: str,
    subtotal: float,
) -> ValidateVoucherResponse:
    """Validasi kode voucher dan kalkulasi potongan harga diskon."""
    now = datetime.now(timezone.utc)
    stmt = (
        select(Voucher)
        .where(
            and_(
                Voucher.code == code.strip().upper(),
                Voucher.is_active.is_(True),
                Voucher.start_date <= now,
                Voucher.end_date >= now,
            )
        )
    )
    res = await db.execute(stmt)
    voucher = res.scalar_one_or_none()
    if not voucher:
        return ValidateVoucherResponse(
            is_valid=False,
            code=code,
            discount_amount=0.0,
            voucher=None,
            message="Kode voucher tidak ditemukan atau sudah kedaluwarsa.",
        )

    if voucher.used_count >= voucher.usage_limit:
        return ValidateVoucherResponse(
            is_valid=False,
            code=code,
            discount_amount=0.0,
            voucher=None,
            message="Kuota penggunaan voucher telah habis.",
        )

    if subtotal < float(voucher.min_purchase):
        return ValidateVoucherResponse(
            is_valid=False,
            code=code,
            discount_amount=0.0,
            voucher=None,
            message=f"Minimal pembelian untuk voucher ini adalah Rp {float(voucher.min_purchase):,.0f}.",
        )

    if voucher.discount_type == "percentage":
        discount = subtotal * (float(voucher.discount_amount) / 100.0)
        if voucher.max_discount and discount > float(voucher.max_discount):
            discount = float(voucher.max_discount)
    else:  # "fixed"
        discount = float(voucher.discount_amount)

    discount = min(discount, subtotal)
    v_resp = VoucherResponse(
        id=voucher.id,
        code=voucher.code,
        name=voucher.name,
        description=voucher.description,
        discount_type=voucher.discount_type,
        discount_amount=float(voucher.discount_amount),
        min_purchase=float(voucher.min_purchase),
        max_discount=float(voucher.max_discount) if voucher.max_discount else None,
        usage_limit=voucher.usage_limit,
        used_count=voucher.used_count,
        start_date=voucher.start_date,
        end_date=voucher.end_date,
        is_active=voucher.is_active,
    )

    return ValidateVoucherResponse(
        is_valid=True,
        code=voucher.code,
        discount_amount=discount,
        voucher=v_resp,
        message="Voucher berhasil digunakan.",
    )


async def create_voucher(db: AsyncSession, data: CreateVoucherRequest) -> VoucherResponse:
    """Membuat data voucher baru."""
    # Cek kode unik
    stmt = select(Voucher).where(Voucher.code == data.code.strip().upper())
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Voucher dengan kode {data.code} sudah ada")

    v = Voucher(
        code=data.code.strip().upper(),
        name=data.name,
        description=data.description,
        discount_type=data.discount_type,
        discount_amount=data.discount_amount,
        min_purchase=data.min_purchase,
        max_discount=data.max_discount,
        usage_limit=data.usage_limit,
        start_date=data.start_date,
        end_date=data.end_date,
        is_active=data.is_active,
    )
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return VoucherResponse(
        id=v.id,
        code=v.code,
        name=v.name,
        description=v.description,
        discount_type=v.discount_type,
        discount_amount=float(v.discount_amount),
        min_purchase=float(v.min_purchase),
        max_discount=float(v.max_discount) if v.max_discount else None,
        usage_limit=v.usage_limit,
        used_count=v.used_count,
        start_date=v.start_date,
        end_date=v.end_date,
        is_active=v.is_active,
    )
