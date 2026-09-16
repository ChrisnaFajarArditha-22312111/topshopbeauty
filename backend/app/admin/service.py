"""
service.py — Business Logic Admin Dashboard & Management
Sesuai PRD Topshop Kosmetik Bandar Lampung
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, desc, and_, or_, update, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.users.models import User
from app.profiles.models import Profile
from app.addresses.models import UserAddress
from app.products.models import (
    Product,
    Brand,
    Category,
    SubCategory,
    SkinType,
    SkinConcern,
    Ingredient,
    ProductImage,
)
from app.orders.models import Order, OrderItem, Payment, Shipment
from app.promotions.models import Voucher
from app.admin.schemas import (
    DashboardStatsResponse,
    TopSellingProduct,
    LowStockProduct,
    RecentOrderSummary,
    SalesChartDataPoint,
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


def _generate_slug(text: str) -> str:
    """Menghasilkan slug URL-friendly dari teks."""
    import re
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    return re.sub(r"[-\s]+", "-", slug).strip("-")


# =========================================================
# 1. DASHBOARD OVERVIEW & ANALYTICS
# =========================================================
async def get_dashboard_stats(db: AsyncSession) -> DashboardStatsResponse:
    """
    Mengambil statistik menyeluruh untuk Dashboard Admin:
    - Total penjualan (omset dari pesanan lunas)
    - Total order & rincian status
    - Total customer & produk
    - Produk terlaris & produk stok menipis (< 10)
    - Order terbaru
    - Grafik penjualan 7 hari terakhir
    """
    valid_statuses = ["paid", "processing", "shipped", "delivered", "completed"]
    sales_stmt = select(func.coalesce(func.sum(Order.total_amount), 0.0)).where(
        Order.status.in_(valid_statuses)
    )
    sales_res = await db.execute(sales_stmt)
    total_penjualan = float(sales_res.scalar() or 0.0)

    total_order_stmt = select(func.count(Order.id))
    total_order_res = await db.execute(total_order_stmt)
    total_order = int(total_order_res.scalar() or 0)

    pending_stmt = select(func.count(Order.id)).where(Order.status.in_(["pending", "processing"]))
    pending_res = await db.execute(pending_stmt)
    pesanan_pending = int(pending_res.scalar() or 0)

    completed_stmt = select(func.count(Order.id)).where(Order.status.in_(["completed", "delivered"]))
    completed_res = await db.execute(completed_stmt)
    pesanan_selesai = int(completed_res.scalar() or 0)

    customer_stmt = select(func.count(User.id))
    customer_res = await db.execute(customer_stmt)
    total_customer = int(customer_res.scalar() or 0)

    prod_stmt = select(func.count(Product.id))
    prod_res = await db.execute(prod_stmt)
    total_produk = int(prod_res.scalar() or 0)

    # Top Selling Products
    top_prod_stmt = (
        select(Product)
        .options(selectinload(Product.brand), selectinload(Product.category))
        .order_by(desc(Product.terjual))
        .limit(5)
    )
    top_prod_res = await db.execute(top_prod_stmt)
    top_prods = top_prod_res.scalars().all()
    top_selling = [
        TopSellingProduct(
            id=p.id,
            product_id=p.id,
            nama_produk=p.nama_produk,
            brand=str(p.brand.name) if p.brand and hasattr(p.brand, "name") and isinstance(p.brand.name, str) else None,
            category=str(p.category.name) if p.category and hasattr(p.category, "name") and isinstance(p.category.name, str) else None,
            harga=float(p.harga),
            terjual=p.terjual,
            stok=p.stok,
            foto_utama=p.foto_utama,
            total_omset=float(p.harga) * p.terjual,
        )
        for p in top_prods
    ]

    # Low Stock Products (stok <= 10)
    low_stock_stmt = (
        select(Product)
        .options(selectinload(Product.brand))
        .where(Product.stok <= 10)
        .order_by(Product.stok.asc())
        .limit(5)
    )
    low_stock_res = await db.execute(low_stock_stmt)
    low_stock_prods = low_stock_res.scalars().all()
    low_stock = [
        LowStockProduct(
            id=p.id,
            product_id=p.id,
            nama_produk=p.nama_produk,
            brand=str(p.brand.name) if p.brand and hasattr(p.brand, "name") and isinstance(p.brand.name, str) else None,
            stok=p.stok,
            harga=float(p.harga),
            foto_utama=p.foto_utama,
        )
        for p in low_stock_prods
    ]

    # Recent Orders
    recent_order_stmt = (
        select(Order)
        .options(selectinload(Order.user), selectinload(Order.payment))
        .order_by(desc(Order.created_at))
        .limit(6)
    )
    recent_order_res = await db.execute(recent_order_stmt)
    recent_orders_list = recent_order_res.scalars().all()
    recent_orders = [
        RecentOrderSummary(
            id=o.id,
            order_number=o.order_number,
            customer_email=o.user.email if o.user else "-",
            customer_name=o.shipping_recipient_name or (o.user.email if o.user else "-"),
            total_amount=float(o.total_amount),
            status=o.status,
            payment_status=o.payment.status if o.payment else "unpaid",
            created_at=o.created_at,
        )
        for o in recent_orders_list
    ]

    # Sales Chart (7 Hari Terakhir)
    now = datetime.now(timezone.utc)
    chart_points = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_str = day_start.strftime("%Y-%m-%d")

        day_sales_stmt = (
            select(
                func.coalesce(func.sum(Order.total_amount), 0.0),
                func.count(Order.id),
            )
            .where(
                and_(
                    Order.created_at >= day_start,
                    Order.created_at < day_end,
                    Order.status.in_(valid_statuses),
                )
            )
        )
        day_sales_res = await db.execute(day_sales_stmt)
        day_sales, day_cnt = day_sales_res.one()
        chart_points.append(
            SalesChartDataPoint(
                date=day_str,
                total_sales=float(day_sales or 0.0),
                total_orders=int(day_cnt or 0),
                order_count=int(day_cnt or 0),
            )
        )

    return DashboardStatsResponse(
        total_penjualan=total_penjualan,
        total_order=total_order,
        total_customer=total_customer,
        total_produk=total_produk,
        pesanan_pending=pesanan_pending,
        pesanan_selesai=pesanan_selesai,
        top_selling_products=top_selling,
        low_stock_products=low_stock,
        recent_orders=recent_orders,
        sales_chart=chart_points,
    )


# =========================================================
# 2. PRODUCT MANAGEMENT (CRUD & ATTRIBUTES)
# =========================================================
async def admin_create_product(db: AsyncSession, data: AdminProductCreate) -> Product:
    """Membuat produk baru lengkap dengan relasi brand, kategori, tipe kulit, dan foto."""
    prod = Product(
        nama_produk=data.nama_produk,
        brand_id=data.brand_id,
        category_id=data.category_id,
        sub_category_id=data.sub_category_id,
        harga=data.harga,
        harga_asli=data.harga_asli or data.harga,
        diskon_persen=data.diskon_persen,
        stok=data.stok,
        foto_utama=data.foto_utama,
        url_produk=data.url_produk,
        is_skincare=data.is_skincare,
        usage_time=data.usage_time,
        texture=data.texture,
        search_document=data.search_document or f"{data.nama_produk} {data.texture or ''} {data.usage_time or ''}",
    )
    db.add(prod)
    await db.flush()

    if data.skin_type_ids:
        st_stmt = select(SkinType).where(SkinType.id.in_(data.skin_type_ids))
        st_res = await db.execute(st_stmt)
        prod.skin_types = list(st_res.scalars().all())

    if data.skin_concern_ids:
        sc_stmt = select(SkinConcern).where(SkinConcern.id.in_(data.skin_concern_ids))
        sc_res = await db.execute(sc_stmt)
        prod.skin_concerns = list(sc_res.scalars().all())

    if data.ingredient_ids:
        ing_stmt = select(Ingredient).where(Ingredient.id.in_(data.ingredient_ids))
        ing_res = await db.execute(ing_stmt)
        prod.ingredients = list(ing_res.scalars().all())

    if data.image_urls:
        for idx, url in enumerate(data.image_urls):
            img = ProductImage(product_id=prod.id, image_url=url, sort_order=idx)
            db.add(img)

    await db.commit()

    # Eager load semua relasi untuk ProductDetailResponse serialization
    reload_stmt = (
        select(Product)
        .options(
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.sub_category),
            selectinload(Product.skin_types),
            selectinload(Product.skin_concerns),
            selectinload(Product.ingredients),
            selectinload(Product.images),
        )
        .where(Product.id == prod.id)
    )
    reload_res = await db.execute(reload_stmt)
    return reload_res.scalar_one()


async def admin_update_product(db: AsyncSession, product_id: uuid.UUID, data: AdminProductUpdate) -> Product:
    """Update informasi dan atribut produk."""
    stmt = (
        select(Product)
        .options(
            selectinload(Product.skin_types),
            selectinload(Product.skin_concerns),
            selectinload(Product.ingredients),
            selectinload(Product.images),
        )
        .where(Product.id == product_id)
    )
    res = await db.execute(stmt)
    prod = res.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produk tidak ditemukan")

    update_fields = [
        "nama_produk", "brand_id", "category_id", "sub_category_id",
        "harga", "harga_asli", "diskon_persen", "stok", "foto_utama",
        "url_produk", "is_skincare", "usage_time", "texture", "search_document"
    ]
    for field in update_fields:
        val = getattr(data, field)
        if val is not None:
            setattr(prod, field, val)

    if data.skin_type_ids is not None:
        st_stmt = select(SkinType).where(SkinType.id.in_(data.skin_type_ids))
        st_res = await db.execute(st_stmt)
        prod.skin_types = list(st_res.scalars().all())

    if data.skin_concern_ids is not None:
        sc_stmt = select(SkinConcern).where(SkinConcern.id.in_(data.skin_concern_ids))
        sc_res = await db.execute(sc_stmt)
        prod.skin_concerns = list(sc_res.scalars().all())

    if data.ingredient_ids is not None:
        ing_stmt = select(Ingredient).where(Ingredient.id.in_(data.ingredient_ids))
        ing_res = await db.execute(ing_stmt)
        prod.ingredients = list(ing_res.scalars().all())

    await db.commit()
    reload_stmt = (
        select(Product)
        .options(
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.sub_category),
            selectinload(Product.skin_types),
            selectinload(Product.skin_concerns),
            selectinload(Product.ingredients),
            selectinload(Product.images),
        )
        .where(Product.id == prod.id)
    )
    reload_res = await db.execute(reload_stmt)
    return reload_res.scalar_one()


async def admin_delete_product(db: AsyncSession, product_id: uuid.UUID) -> None:
    """Hapus produk dari katalog."""
    stmt = select(Product).where(Product.id == product_id)
    res = await db.execute(stmt)
    prod = res.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produk tidak ditemukan")

    await db.delete(prod)
    await db.commit()


# =========================================================
# 3. ORDER MANAGEMENT (PROCESS, STATUS, TRACKING)
# =========================================================
async def admin_list_orders(
    db: AsyncSession,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Order]:
    """Mengambil daftar pesanan toko dengan opsi filter status."""
    stmt = (
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.payment),
            selectinload(Order.shipment),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .order_by(desc(Order.created_at))
        .offset(offset)
        .limit(limit)
    )
    if status_filter:
        stmt = stmt.where(Order.status == status_filter)

    res = await db.execute(stmt)
    return list(res.scalars().all())


async def admin_get_order_detail(db: AsyncSession, order_id: uuid.UUID) -> Order:
    """Mengambil rincian lengkap pesanan untuk verifikasi admin."""
    stmt = (
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.payment),
            selectinload(Order.shipment),
            selectinload(Order.items).selectinload(OrderItem.product),
        )
        .where(Order.id == order_id)
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pesanan tidak ditemukan")
    return order


async def admin_update_order_status(
    db: AsyncSession, order_id: uuid.UUID, data: AdminOrderStatusUpdate
) -> Order:
    """Mengubah status pemrosesan pesanan (processing, shipped, completed, cancelled)."""
    order = await admin_get_order_detail(db, order_id)
    order.status = data.status
    if data.notes:
        order.customer_notes = data.notes

    if data.status in ["cancelled", "refunded"]:
        for item in order.items:
            prod_stmt = select(Product).where(Product.id == item.product_id)
            prod_res = await db.execute(prod_stmt)
            p = prod_res.scalar_one_or_none()
            if p:
                p.stok += item.quantity
                p.terjual = max(0, p.terjual - item.quantity)

    if data.status == "paid" and order.payment:
        order.payment.status = "paid"
        order.payment.paid_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(order)
    return order


async def admin_input_order_tracking(
    db: AsyncSession, order_id: uuid.UUID, data: AdminOrderTrackingInput
) -> Order:
    """Input nomor resi kurir pengiriman dan perbarui status pesanan menjadi 'shipped'."""
    order = await admin_get_order_detail(db, order_id)

    if not order.shipment:
        order.shipment = Shipment(
            order_id=order.id,
            courier_code=data.courier.lower(),
            service_code="standard",
            tracking_number=data.tracking_number,
            shipping_status="shipped",
            shipped_at=datetime.now(timezone.utc),
        )
        db.add(order.shipment)
    else:
        order.shipment.courier_code = data.courier.lower()
        order.shipment.tracking_number = data.tracking_number
        order.shipment.shipping_status = "shipped"
        order.shipment.shipped_at = datetime.now(timezone.utc)

    order.status = "shipped"
    await db.commit()
    await db.refresh(order)
    return order


# =========================================================
# 4. CUSTOMER MANAGEMENT
# =========================================================
async def admin_list_customers(
    db: AsyncSession,
    limit: int = 50,
    offset: int = 0,
) -> List[CustomerListItem]:
    """Melihat daftar seluruh pengguna dengan ringkasan transaksi belanja."""
    stmt = (
        select(User)
        .options(selectinload(User.profile))
        .order_by(desc(User.created_at))
        .offset(offset)
        .limit(limit)
    )
    res = await db.execute(stmt)
    users = res.scalars().all()

    result = []
    for u in users:
        # Ambil pesanan user secara terpisah
        order_stmt = select(Order).where(Order.user_id == u.id)
        order_res = await db.execute(order_stmt)
        user_orders = order_res.scalars().all()

        total_orders = len(user_orders)
        total_spend = sum(
            float(o.total_amount)
            for o in user_orders
            if o.status in ["paid", "delivered", "completed"]
        )
        result.append(
            CustomerListItem(
                id=u.id,
                email=u.email,
                full_name=u.profile.full_name if u.profile else None,
                phone=u.profile.phone if u.profile else None,
                email_verified=u.email_verified,
                is_active=u.is_active,
                is_admin=u.is_admin,
                total_orders=total_orders,
                total_spend=total_spend,
                created_at=u.created_at,
            )
        )
    return result


async def admin_get_customer_detail(db: AsyncSession, user_id: uuid.UUID) -> CustomerDetailResponse:
    """Melihat detail profil, alamat, dan riwayat pesanan customer."""
    stmt = (
        select(User)
        .options(
            selectinload(User.profile),
            selectinload(User.addresses),
        )
        .where(User.id == user_id)
    )
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer tidak ditemukan")

    order_stmt = (
        select(Order)
        .options(selectinload(Order.payment))
        .where(Order.user_id == u.id)
        .order_by(desc(Order.created_at))
    )
    order_res = await db.execute(order_stmt)
    user_orders = order_res.scalars().all()

    orders_summary = [
        RecentOrderSummary(
            id=o.id,
            order_number=o.order_number,
            customer_email=u.email,
            total_amount=float(o.total_amount),
            status=o.status,
            payment_status=o.payment.status if o.payment else "unpaid",
            created_at=o.created_at,
        )
        for o in user_orders
    ]
    total_spend = sum(
        float(o.total_amount)
        for o in user_orders
        if o.status in ["paid", "delivered", "completed"]
    )

    profile_dict = None
    if u.profile:
        profile_dict = {
            "full_name": u.profile.full_name,
            "phone": u.profile.phone,
            "gender": u.profile.gender,
            "date_of_birth": str(u.profile.date_of_birth) if u.profile.date_of_birth else None,
        }

    return CustomerDetailResponse(
        id=u.id,
        email=u.email,
        email_verified=u.email_verified,
        is_active=u.is_active,
        is_admin=u.is_admin,
        created_at=u.created_at,
        profile=profile_dict,
        addresses_count=len(u.addresses) if u.addresses else 0,
        orders=orders_summary,
        total_spend=total_spend,
    )


async def admin_update_customer_status(
    db: AsyncSession, user_id: uuid.UUID, data: CustomerStatusUpdate
) -> User:
    """Aktivasi/Nonaktifkan akun user atau ubah role admin."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    u = res.scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer tidak ditemukan")

    u.is_active = data.is_active
    if data.is_admin is not None:
        u.is_admin = data.is_admin

    await db.commit()
    await db.refresh(u)
    return u


# =========================================================
# 5. MASTER DATA (BRAND, CATEGORY, INGREDIENTS, SKIN)
# =========================================================
async def admin_create_category(db: AsyncSession, data: AdminCategoryCreate) -> Category:
    slug = _generate_slug(data.name)
    cat = Category(name=data.name, slug=slug, description=data.description)
    db.add(cat)
    await db.commit()
    reload_stmt = select(Category).options(selectinload(Category.sub_categories)).where(Category.id == cat.id)
    reload_res = await db.execute(reload_stmt)
    return reload_res.scalar_one()


async def admin_create_sub_category(db: AsyncSession, data: AdminSubCategoryCreate) -> SubCategory:
    slug = _generate_slug(data.name)
    sub = SubCategory(category_id=data.category_id, name=data.name, slug=slug)
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


async def admin_create_brand(db: AsyncSession, data: AdminBrandCreate) -> Brand:
    slug = _generate_slug(data.name)
    brand = Brand(name=data.name, slug=slug, description=data.description, logo_url=data.logo_url)
    db.add(brand)
    await db.commit()
    await db.refresh(brand)
    return brand


async def admin_create_skin_type(db: AsyncSession, data: AdminMasterDataCreate) -> SkinType:
    st = SkinType(name=data.name, description=data.description)
    db.add(st)
    await db.commit()
    await db.refresh(st)
    return st


async def admin_create_skin_concern(db: AsyncSession, data: AdminMasterDataCreate) -> SkinConcern:
    sc = SkinConcern(name=data.name, description=data.description)
    db.add(sc)
    await db.commit()
    await db.refresh(sc)
    return sc


async def admin_create_ingredient(db: AsyncSession, data: AdminMasterDataCreate) -> Ingredient:
    ing = Ingredient(name=data.name, description=data.description)
    db.add(ing)
    await db.commit()
    await db.refresh(ing)
    return ing


# =========================================================
# 6. PROMOTION & VOUCHER MANAGEMENT
# =========================================================
async def admin_create_voucher(db: AsyncSession, data: AdminVoucherCreate) -> Voucher:
    """Admin membuat voucher promosi diskon belanja baru."""
    stmt = select(Voucher).where(Voucher.code == data.code.upper())
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Voucher dengan kode '{data.code.upper()}' sudah ada.",
        )

    voucher = Voucher(
        code=data.code.upper(),
        name=data.name,
        description=data.description,
        discount_type=data.discount_type,
        discount_amount=data.discount_amount,
        min_purchase=data.min_purchase,
        max_discount=data.max_discount,
        start_date=data.start_date,
        end_date=data.end_date,
        usage_limit=data.usage_limit,
        used_count=0,
        is_active=data.is_active,
    )
    db.add(voucher)
    await db.commit()
    await db.refresh(voucher)
    return voucher


async def admin_list_vouchers(db: AsyncSession) -> List[Voucher]:
    """Melihat seluruh voucher promosi aktif maupun non-aktif."""
    stmt = select(Voucher).order_by(desc(Voucher.created_at))
    res = await db.execute(stmt)
    return list(res.scalars().all())


async def admin_toggle_voucher(db: AsyncSession, voucher_id: uuid.UUID, is_active: bool) -> Voucher:
    """Mengaktifkan atau menonaktifkan voucher promosi."""
    stmt = select(Voucher).where(Voucher.id == voucher_id)
    res = await db.execute(stmt)
    v = res.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Voucher tidak ditemukan")
    v.is_active = is_active
    await db.commit()
    await db.refresh(v)
    return v
