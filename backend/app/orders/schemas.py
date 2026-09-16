"""
schemas.py — Pydantic Schemas untuk Checkout, Orders, Payments, Shipments, Reviews, & Vouchers
"""
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


# =========================================================
# Voucher Schemas
# =========================================================

class ApplyVoucherRequest(BaseModel):
    code: str


class VoucherResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    discount_type: str
    discount_amount: float
    min_purchase: float
    max_discount: Optional[float] = None

    class Config:
        from_attributes = True


# =========================================================
# Shipping & Courier Rate Schemas
# =========================================================

class ShippingRateRequest(BaseModel):
    address_id: uuid.UUID
    courier_code: str  # e.g., "jne", "sicepat", "jnt"


class CourierOptionResponse(BaseModel):
    courier_code: str
    courier_name: str
    service_code: str
    service_name: str
    price: float
    etd: str  # e.g., "1-2 hari"


# =========================================================
# Checkout & Order Schemas
# =========================================================

class CheckoutPreviewRequest(BaseModel):
    address_id: uuid.UUID
    courier_code: str
    service_code: str
    voucher_code: Optional[str] = None


class CheckoutPreviewResponse(BaseModel):
    subtotal: float
    shipping_cost: float
    discount_amount: float
    total_amount: float
    item_count: int
    voucher_applied: Optional[str] = None


class CreateOrderRequest(BaseModel):
    address_id: uuid.UUID
    courier_code: str
    service_code: str
    payment_method: str = "qris"  # "qris", "va_bca", "va_mandiri", "va_bri"
    voucher_code: Optional[str] = None
    customer_notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    price: float
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class PaymentInfoResponse(BaseModel):
    id: uuid.UUID
    payment_method: str
    amount: float
    status: str
    mayar_payment_url: Optional[str] = None
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ShipmentInfoResponse(BaseModel):
    id: uuid.UUID
    courier_code: str
    service_code: str
    tracking_number: Optional[str] = None
    shipping_status: str

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: uuid.UUID
    order_number: str
    status: str
    subtotal: float
    discount_amount: float
    shipping_cost: float
    total_amount: float
    shipping_recipient_name: str
    shipping_phone: str
    shipping_address: str
    shipping_city: str
    shipping_courier: str
    shipping_service: str
    items: List[OrderItemResponse] = []
    payment: Optional[PaymentInfoResponse] = None
    shipment: Optional[ShipmentInfoResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================================================
# Webhook Mayar & Biteship Schemas
# =========================================================

class MayarWebhookPayload(BaseModel):
    event: str
    data: dict


class BiteshipWebhookPayload(BaseModel):
    event: str
    order_id: Optional[str] = None
    tracking_id: Optional[str] = None
    status: str


# =========================================================
# Reviews Schemas
# =========================================================

class CreateReviewRequest(BaseModel):
    order_item_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None
    photo_url: Optional[str] = None


class ReviewResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    user_name: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
