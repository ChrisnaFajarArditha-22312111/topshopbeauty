"""
schemas.py — Schemas Pydantic untuk Admin Dashboard dan Management
Sesuai PRD Topshop Kosmetik AI
"""
import uuid
from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


# =========================================================
# Dashboard Schemas
# =========================================================
class TopSellingProduct(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    nama_produk: str
    brand: Optional[str] = None
    category: Optional[str] = None
    harga: float
    terjual: int
    stok: int
    foto_utama: Optional[str] = None
    total_omset: Optional[float] = 0.0

    class Config:
        from_attributes = True


class LowStockProduct(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID] = None
    nama_produk: str
    brand: Optional[str] = None
    stok: int
    harga: float
    foto_utama: Optional[str] = None

    class Config:
        from_attributes = True


class RecentOrderSummary(BaseModel):
    id: uuid.UUID
    order_number: str
    customer_email: str
    customer_name: Optional[str] = None
    total_amount: float
    status: str
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SalesChartDataPoint(BaseModel):
    date: str
    total_sales: float
    total_orders: int
    order_count: Optional[int] = None


class DashboardStatsResponse(BaseModel):
    total_penjualan: float = Field(..., description="Total nominal pendapatan dari pesanan yang dibayar")
    total_order: int = Field(..., description="Jumlah total seluruh pesanan")
    total_customer: int = Field(..., description="Jumlah seluruh pengguna terdaftar")
    total_produk: int = Field(..., description="Jumlah total produk katalog")
    pesanan_pending: int = Field(..., description="Pesanan menunggu pembayaran/proses")
    pesanan_selesai: int = Field(..., description="Pesanan selesai")
    top_selling_products: List[TopSellingProduct] = []
    low_stock_products: List[LowStockProduct] = []
    recent_orders: List[RecentOrderSummary] = []
    sales_chart: List[SalesChartDataPoint] = []


# =========================================================
# Product Management Schemas
# =========================================================
class AdminProductCreate(BaseModel):
    nama_produk: str = Field(..., min_length=2, max_length=255)
    brand_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    sub_category_id: Optional[uuid.UUID] = None
    harga: float = Field(..., gt=0)
    harga_asli: Optional[float] = None
    diskon_persen: Optional[str] = None
    stok: int = Field(default=0, ge=0)
    foto_utama: Optional[str] = None
    url_produk: Optional[str] = None
    is_skincare: bool = True
    usage_time: Optional[str] = None
    texture: Optional[str] = None
    search_document: Optional[str] = None
    skin_type_ids: List[uuid.UUID] = []
    skin_concern_ids: List[uuid.UUID] = []
    ingredient_ids: List[uuid.UUID] = []
    image_urls: List[str] = []


class AdminProductUpdate(BaseModel):
    nama_produk: Optional[str] = None
    brand_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    sub_category_id: Optional[uuid.UUID] = None
    harga: Optional[float] = None
    harga_asli: Optional[float] = None
    diskon_persen: Optional[str] = None
    stok: Optional[int] = None
    foto_utama: Optional[str] = None
    url_produk: Optional[str] = None
    is_skincare: Optional[bool] = None
    usage_time: Optional[str] = None
    texture: Optional[str] = None
    search_document: Optional[str] = None
    skin_type_ids: Optional[List[uuid.UUID]] = None
    skin_concern_ids: Optional[List[uuid.UUID]] = None
    ingredient_ids: Optional[List[uuid.UUID]] = None
    image_urls: Optional[List[str]] = None


# =========================================================
# Order Management Schemas
# =========================================================
class AdminOrderStatusUpdate(BaseModel):
    status: str = Field(..., description="pending | paid | processing | shipped | delivered | completed | cancelled | refunded")
    notes: Optional[str] = None


class AdminOrderTrackingInput(BaseModel):
    courier: str = Field(..., description="Kode kurir: jne, sicepat, jnt")
    tracking_number: str = Field(..., min_length=3, description="Nomor resi pengiriman")


# =========================================================
# Customer Management Schemas
# =========================================================
class CustomerListItem(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email_verified: bool
    is_active: bool
    is_admin: bool
    total_orders: int = 0
    total_spend: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerDetailResponse(BaseModel):
    id: uuid.UUID
    email: str
    email_verified: bool
    is_active: bool
    is_admin: bool
    created_at: datetime
    profile: Optional[Dict[str, Any]] = None
    addresses_count: int = 0
    orders: List[RecentOrderSummary] = []
    total_spend: float = 0.0


class CustomerStatusUpdate(BaseModel):
    is_active: bool
    is_admin: Optional[bool] = None


# =========================================================
# Category & Brand & Master Data Schemas
# =========================================================
class AdminCategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None


class AdminSubCategoryCreate(BaseModel):
    category_id: uuid.UUID
    name: str = Field(..., min_length=2, max_length=100)


class AdminBrandCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    logo_url: Optional[str] = None


class AdminMasterDataCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None


# =========================================================
# Promotion & Voucher Management Schemas
# =========================================================
class AdminVoucherCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    discount_type: str = Field(..., description="percentage | fixed")
    discount_amount: float = Field(..., gt=0)
    min_purchase: float = Field(default=0, ge=0)
    max_discount: Optional[float] = None
    start_date: datetime
    end_date: datetime
    usage_limit: int = Field(default=100, ge=1)
    is_active: bool = True
