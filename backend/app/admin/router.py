"""
router.py — Endpoint API Admin Dashboard & Management
Prefix: /api/v1/admin
Semua endpoint dalam router ini diproteksi oleh RBAC dependency: require_admin
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.auth.schemas import MessageResponse
from app.products.schemas import (
    ProductDetailResponse,
    CategoryResponse,
    BrandResponse,
    SkinTypeResponse,
    SkinConcernResponse,
    IngredientResponse,
)
from app.orders.schemas import OrderResponse, VoucherResponse
from app.admin.schemas import (
    DashboardStatsResponse,
    AdminProductCreate,
    AdminProductUpdate,
    AdminOrderStatusUpdate,
    AdminOrderTrackingInput,
    CustomerListItem,
    CustomerDetailResponse,
    CustomerStatusUpdate,
    AdminCategoryCreate,
    AdminSubCategoryCreate,
    AdminBrandCreate,
    AdminMasterDataCreate,
    AdminVoucherCreate,
)
from app.admin import service

router = APIRouter(dependencies=[Depends(require_admin)])


# =========================================================
# 1. Dashboard Overview
# =========================================================
@router.get("/dashboard/stats", response_model=DashboardStatsResponse, summary="Statistik Lengkap Dashboard Admin")
async def get_dashboard_statistics(
    db: AsyncSession = Depends(get_db),
):
    """
    Mengambil ringkasan statistik toko:
    - Total penjualan (omset lunas)
    - Total order & rincian pesanan pending/selesai
    - Total customer & produk
    - Produk terlaris & produk stok menipis (< 10)
    - Order terbaru
    - Grafik tren penjualan 7 hari terakhir
    """
    return await service.get_dashboard_stats(db)


# =========================================================
# 2. Product Management
# =========================================================
@router.post("/products", response_model=ProductDetailResponse, status_code=status.HTTP_201_CREATED, summary="Tambah Produk Baru")
async def create_new_product(
    data: AdminProductCreate,
    db: AsyncSession = Depends(get_db),
):
    """Admin membuat produk kosmetik/skincare baru ke katalog toko."""
    return await service.admin_create_product(db, data)


@router.patch("/products/{product_id}", response_model=ProductDetailResponse, summary="Update Data & Atribut Produk")
async def update_product(
    product_id: uuid.UUID,
    data: AdminProductUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Admin memperbarui harga, stok, deskripsi, foto, atau spesifikasi kecantikan produk."""
    return await service.admin_update_product(db, product_id, data)


@router.delete("/products/{product_id}", response_model=MessageResponse, summary="Hapus Produk dari Katalog")
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Menghapus produk dari database katalog."""
    await service.admin_delete_product(db, product_id)
    return MessageResponse(message="Produk berhasil dihapus dari katalog.")


# =========================================================
# 3. Order Management
# =========================================================
@router.get("/orders", response_model=List[OrderResponse], summary="Daftar Seluruh Pesanan Toko")
async def list_store_orders(
    status: Optional[str] = Query(None, description="Filter status: pending, paid, processing, shipped, delivered, completed, cancelled"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Melihat seluruh pesanan yang masuk ke toko beserta status pembayaran & pengiriman."""
    return await service.admin_list_orders(db, status_filter=status, limit=limit, offset=offset)


@router.get("/orders/{order_id}", response_model=OrderResponse, summary="Detail Lengkap Pesanan")
async def get_order_detail(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Melihat rincian satu pesanan: item belanja, snapshot alamat, log pembayaran, dan kurir."""
    return await service.admin_get_order_detail(db, order_id)


@router.patch("/orders/{order_id}/status", response_model=OrderResponse, summary="Ubah Status Pesanan")
async def update_order_status(
    order_id: uuid.UUID,
    data: AdminOrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Mengubah status pesanan toko (misal memproses barang, membatalkan, atau menyelesaikan)."""
    return await service.admin_update_order_status(db, order_id, data)


@router.post("/orders/{order_id}/tracking", response_model=OrderResponse, summary="Input Nomor Resi Kurir Pengiriman")
async def input_order_tracking(
    order_id: uuid.UUID,
    data: AdminOrderTrackingInput,
    db: AsyncSession = Depends(get_db),
):
    """Input nomor resi kurir pengiriman (JNE, SiCepat, J&T) dan otomatis mengubah status pesanan ke 'shipped'."""
    return await service.admin_input_order_tracking(db, order_id, data)


# =========================================================
# 4. Customer Management
# =========================================================
@router.get("/customers", response_model=List[CustomerListItem], summary="Daftar Seluruh Pengguna (Pelanggan)")
async def list_customers(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Melihat daftar seluruh pengguna dengan total transaksi dan nilai belanja (password tidak diekspos)."""
    return await service.admin_list_customers(db, limit=limit, offset=offset)


@router.get("/customers/{user_id}", response_model=CustomerDetailResponse, summary="Detail Profil & Riwayat Belanja Customer")
async def get_customer_detail(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Melihat informasi profil pengguna, jumlah alamat tersimpan, dan riwayat seluruh pesanannya."""
    return await service.admin_get_customer_detail(db, user_id)


@router.patch("/customers/{user_id}/status", response_model=MessageResponse, summary="Aktivasi/Nonaktifkan Akun Pengguna")
async def update_customer_status(
    user_id: uuid.UUID,
    data: CustomerStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Mengaktifkan/menonaktifkan akun customer atau memberikan hak akses Admin."""
    await service.admin_update_customer_status(db, user_id, data)
    return MessageResponse(message="Status akun pelanggan berhasil diperbarui.")


# =========================================================
# 5. Category, Brand & Master Data Management
# =========================================================
@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, summary="Tambah Kategori Baru")
async def create_category(
    data: AdminCategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.admin_create_category(db, data)


@router.post("/sub-categories", summary="Tambah Sub-Kategori Baru")
async def create_sub_category(
    data: AdminSubCategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    sub = await service.admin_create_sub_category(db, data)
    return {"id": sub.id, "name": sub.name, "slug": sub.slug, "category_id": sub.category_id}


@router.post("/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED, summary="Tambah Brand Baru")
async def create_brand(
    data: AdminBrandCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.admin_create_brand(db, data)


@router.post("/skin-types", response_model=SkinTypeResponse, status_code=status.HTTP_201_CREATED, summary="Tambah Master Skin Type")
async def create_skin_type(
    data: AdminMasterDataCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.admin_create_skin_type(db, data)


@router.post("/skin-concerns", response_model=SkinConcernResponse, status_code=status.HTTP_201_CREATED, summary="Tambah Master Skin Concern")
async def create_skin_concern(
    data: AdminMasterDataCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.admin_create_skin_concern(db, data)


@router.post("/ingredients", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED, summary="Tambah Master Ingredient")
async def create_ingredient(
    data: AdminMasterDataCreate,
    db: AsyncSession = Depends(get_db),
):
    return await service.admin_create_ingredient(db, data)


# =========================================================
# 6. Promotion & Voucher Management
# =========================================================
@router.post("/promotions/vouchers", response_model=VoucherResponse, status_code=status.HTTP_201_CREATED, summary="Buat Voucher Promosi Baru")
async def create_voucher(
    data: AdminVoucherCreate,
    db: AsyncSession = Depends(get_db),
):
    """Admin membuat kode promo / voucher diskon baru untuk kampanye marketing."""
    return await service.admin_create_voucher(db, data)


@router.get("/promotions/vouchers", response_model=List[VoucherResponse], summary="Daftar Seluruh Voucher Promosi")
async def list_vouchers(
    db: AsyncSession = Depends(get_db),
):
    """Melihat seluruh voucher toko, baik yang sedang aktif maupun non-aktif."""
    return await service.admin_list_vouchers(db)


@router.patch("/promotions/vouchers/{voucher_id}/toggle", response_model=VoucherResponse, summary="Aktifkan/Nonaktifkan Voucher")
async def toggle_voucher_status(
    voucher_id: uuid.UUID,
    is_active: bool = Query(..., description="Status aktif voucher (true/false)"),
    db: AsyncSession = Depends(get_db),
):
    """Mengubah status ketersediaan voucher promosi."""
    return await service.admin_toggle_voucher(db, voucher_id, is_active)
