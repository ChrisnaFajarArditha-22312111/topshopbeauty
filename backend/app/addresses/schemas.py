"""
schemas.py — Pydantic schemas untuk alamat pengguna
"""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    label: str = Field("Rumah", max_length=50)
    recipient_name: str = Field(..., min_length=2, max_length=100)
    phone: str = Field(..., min_length=6, max_length=20)
    address: str = Field(..., min_length=5)
    province: str = Field(..., min_length=2, max_length=100)
    city: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    postal_code: str = Field(..., min_length=3, max_length=10)
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, max_length=50)
    recipient_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=6, max_length=20)
    address: Optional[str] = None
    province: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    postal_code: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
