"""
schemas.py — Schemas untuk Voucher dan Promosi Diskon
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class VoucherResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: Optional[str] = None
    discount_type: str  # "fixed" | "percentage"
    discount_amount: float
    min_purchase: float
    max_discount: Optional[float] = None
    usage_limit: int
    used_count: int
    start_date: datetime
    end_date: datetime
    is_active: bool

    class Config:
        from_attributes = True


class ValidateVoucherRequest(BaseModel):
    code: str
    subtotal: float = Field(..., ge=0)


class ValidateVoucherResponse(BaseModel):
    is_valid: bool
    code: str
    discount_amount: float
    voucher: Optional[VoucherResponse] = None
    message: str


class CreateVoucherRequest(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    discount_type: str = "fixed"  # "fixed" atau "percentage"
    discount_amount: float
    min_purchase: float = 0.0
    max_discount: Optional[float] = None
    usage_limit: int = 100
    start_date: datetime
    end_date: datetime
    is_active: bool = True
