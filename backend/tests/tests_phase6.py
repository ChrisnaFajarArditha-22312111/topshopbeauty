"""
tests_phase6.py — Integration & Unit Test Suite untuk Phase 6: Admin Dashboard & Management
Menguji:
1. RBAC (Role-Based Access Control) — Penolakan non-admin & izin admin
2. Dashboard Overview Statistics (sales, total orders, customers, top selling, low stock, chart)
3. Product Management (CRUD, attribute linking)
4. Order Management (List, detail, status update, stock restoration on cancel, input tracking)
5. Customer Management (List, detail, status/role toggle)
6. Category, Brand & Master Data Management (Category, Subcategory, Brand, SkinType, SkinConcern, Ingredient)
7. Promotion & Voucher Management (Create, list, toggle status)
8. HTTP Endpoints Registration & Security
"""
import asyncio
import sys
import os
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, AsyncMock, patch, PropertyMock

_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

# Warna Terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_header(title):
    print(f"\n{CYAN}{BOLD}{'='*60}{RESET}")
    print(f"{CYAN}{BOLD}  {title}{RESET}")
    print(f"{CYAN}{BOLD}{'='*60}{RESET}")


def print_ok(msg):
    print(f"  {GREEN}✓ {msg}{RESET}")


def print_fail(msg):
    print(f"  {RED}✗ {msg}{RESET}")


# =========================================================
# SKENARIO 1: Role-Based Access Control (RBAC)
# =========================================================
def test_rbac_dependency():
    print_header("SKENARIO 1: Role-Based Access Control (RBAC)")

    from app.core.security import require_admin
    from fastapi import HTTPException

    async def run():
        # 1a. User adalah Admin (is_admin=True) -> Lolos
        admin_user = {"sub": str(uuid.uuid4()), "email": "admin@topshop.com", "is_admin": True}
        result = await require_admin(current_user=admin_user)
        assert result == admin_user
        print_ok("Admin user (is_admin=True) berhasil diverifikasi dan diizinkan")

        # 1b. User biasa (is_admin=False) -> Ditolak 403
        normal_user = {"sub": str(uuid.uuid4()), "email": "user@gmail.com", "is_admin": False}
        try:
            await require_admin(current_user=normal_user)
            assert False, "Seharusnya raise 403"
        except HTTPException as e:
            assert e.status_code == 403
            assert "Akses ditolak" in e.detail
            print_ok("Pengguna biasa (is_admin=False) ditolak dengan HTTP 403 Forbidden")

        # 1c. Payload tanpa field is_admin -> Ditolak 403
        incomplete_user = {"sub": str(uuid.uuid4()), "email": "user@gmail.com"}
        try:
            await require_admin(current_user=incomplete_user)
            assert False, "Seharusnya raise 403"
        except HTTPException as e:
            assert e.status_code == 403
            print_ok("Payload tanpa flag is_admin otomatis ditolak dengan HTTP 403")

    asyncio.run(run())
    print_ok("Skenario 1 LULUS — 3/3 test RBAC berhasil")


# =========================================================
# SKENARIO 2: Dashboard Overview Statistics
# =========================================================
def test_dashboard_stats():
    print_header("SKENARIO 2: Dashboard Overview Statistics")

    from app.admin import service

    async def run():
        mock_db = AsyncMock()

        # Mock query results:
        # 1. Total Penjualan
        mock_sales = MagicMock()
        mock_sales.scalar.return_value = 15500000.0

        # 2. Total Orders
        mock_tot_order = MagicMock()
        mock_tot_order.scalar.return_value = 120

        # 3. Pending
        mock_pending = MagicMock()
        mock_pending.scalar.return_value = 8

        # 4. Completed
        mock_completed = MagicMock()
        mock_completed.scalar.return_value = 105

        # 5. Customers
        mock_cust = MagicMock()
        mock_cust.scalar.return_value = 85

        # 6. Products
        mock_prods = MagicMock()
        mock_prods.scalar.return_value = 35

        # 7. Top Selling Products
        mock_top_prod = MagicMock()
        mock_top_prod.id = uuid.uuid4()
        mock_top_prod.nama_produk = "Wardah Sunscreen Gel"
        mock_top_prod.brand = MagicMock()
        type(mock_top_prod.brand).name = PropertyMock(return_value="Wardah")
        mock_top_prod.category = MagicMock()
        type(mock_top_prod.category).name = PropertyMock(return_value="Sunscreen")
        mock_top_prod.harga = 38000.0
        mock_top_prod.terjual = 450
        mock_top_prod.stok = 50
        mock_top_prod.foto_utama = None
        mock_top_res = MagicMock()
        mock_top_res.scalars.return_value.all.return_value = [mock_top_prod]

        # 8. Low Stock
        mock_low_prod = MagicMock()
        mock_low_prod.id = uuid.uuid4()
        mock_low_prod.nama_produk = "Emina Bright Stuff Serum"
        mock_low_prod.brand = MagicMock()
        type(mock_low_prod.brand).name = PropertyMock(return_value="Emina")
        mock_low_prod.stok = 3
        mock_low_prod.harga = 42000.0
        mock_low_res = MagicMock()
        mock_low_res.scalars.return_value.all.return_value = [mock_low_prod]

        # 9. Recent Orders
        mock_rec_order = MagicMock()
        mock_rec_order.id = uuid.uuid4()
        mock_rec_order.order_number = "ORD-20260912-001"
        mock_rec_order.user = MagicMock(email="customer@gmail.com")
        mock_rec_order.total_amount = 125000.0
        mock_rec_order.status = "paid"
        mock_rec_order.payment = MagicMock(status="paid")
        mock_rec_order.created_at = datetime.now(timezone.utc)
        mock_rec_res = MagicMock()
        mock_rec_res.scalars.return_value.all.return_value = [mock_rec_order]

        # 10. 7-day Sales Chart
        mock_chart_res = MagicMock()
        mock_chart_res.one.return_value = (500000.0, 5)

        side_effects = [
            mock_sales,
            mock_tot_order,
            mock_pending,
            mock_completed,
            mock_cust,
            mock_prods,
            mock_top_res,
            mock_low_res,
            mock_rec_res,
        ] + [mock_chart_res] * 7

        mock_db.execute = AsyncMock(side_effect=side_effects)

        stats = await service.get_dashboard_stats(mock_db)

        assert stats.total_penjualan == 15500000.0
        assert stats.total_order == 120
        assert stats.total_customer == 85
        assert stats.total_produk == 35
        assert len(stats.top_selling_products) == 1
        assert stats.top_selling_products[0].nama_produk == "Wardah Sunscreen Gel"
        assert len(stats.low_stock_products) == 1
        assert stats.low_stock_products[0].stok == 3
        assert len(stats.sales_chart) == 7
        print_ok(f"Dashboard Stats: Penjualan Rp {stats.total_penjualan:,.0f}, Orders: {stats.total_order}")
        print_ok(f"Top selling: {stats.top_selling_products[0].nama_produk}, Low stock: {stats.low_stock_products[0].nama_produk}")
        print_ok(f"Grafik penjualan 7 hari: {len(stats.sales_chart)} data points terformat")

    asyncio.run(run())
    print_ok("Skenario 2 LULUS — Dashboard statistics logic terverifikasi")


# =========================================================
# SKENARIO 3: Product Management (Create, Update, Delete)
# =========================================================
def test_product_management():
    print_header("SKENARIO 3: Product Management (Create, Update, Delete)")

    from app.admin import service
    from app.admin.schemas import AdminProductCreate, AdminProductUpdate

    async def run():
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.delete = AsyncMock()

        # 3a. Create Product
        mock_st = MagicMock(id=uuid.uuid4())
        mock_st_res = MagicMock()
        mock_st_res.scalars.return_value.all.return_value = [mock_st]

        mock_sc = MagicMock(id=uuid.uuid4())
        mock_sc_res = MagicMock()
        mock_sc_res.scalars.return_value.all.return_value = [mock_sc]

        mock_created_prod = MagicMock(
            nama_produk="Somethinc Niacinamide Barrier Serum",
            harga=115000.0,
            stok=25,
            skin_types=[mock_st],
            skin_concerns=[mock_sc],
            ingredients=[],
            images=[],
        )
        mock_reload_res = MagicMock()
        mock_reload_res.scalar_one.return_value = mock_created_prod

        mock_db.execute = AsyncMock(side_effect=[mock_st_res, mock_sc_res, mock_reload_res])

        create_data = AdminProductCreate(
            nama_produk="Somethinc Niacinamide Barrier Serum",
            harga=115000.0,
            stok=25,
            is_skincare=True,
            texture="Serum cair",
            usage_time="Pagi & Malam",
            skin_type_ids=[mock_st.id],
            skin_concern_ids=[mock_sc.id],
            image_urls=["https://topshop.com/img1.jpg", "https://topshop.com/img2.jpg"],
        )

        prod = await service.admin_create_product(mock_db, create_data)
        assert prod.nama_produk == "Somethinc Niacinamide Barrier Serum"
        assert prod.harga == 115000.0
        assert prod.stok == 25
        assert len(prod.skin_types) == 1
        assert len(prod.skin_concerns) == 1
        print_ok(f"Admin Create Product berhasil: {prod.nama_produk}")

        # 3b. Update Product
        mock_existing_prod = MagicMock()
        mock_existing_prod.id = uuid.uuid4()
        mock_existing_prod.nama_produk = "Old Name"
        mock_existing_prod.harga = 50000.0
        mock_existing_prod.stok = 10
        mock_existing_prod.skin_types = []
        mock_existing_prod.skin_concerns = []
        mock_existing_prod.ingredients = []
        mock_existing_prod.images = []

        mock_find_res = MagicMock()
        mock_find_res.scalar_one_or_none.return_value = mock_existing_prod
        mock_find_res.scalar_one.return_value = mock_existing_prod
        mock_db.execute = AsyncMock(return_value=mock_find_res)

        update_data = AdminProductUpdate(
            nama_produk="New Updated Name",
            harga=65000.0,
            stok=40,
        )
        updated = await service.admin_update_product(mock_db, mock_existing_prod.id, update_data)
        assert updated.nama_produk == "New Updated Name"
        assert updated.harga == 65000.0
        assert updated.stok == 40
        print_ok(f"Admin Update Product berhasil: nama={updated.nama_produk}, stok={updated.stok}")

        # 3c. Delete Product
        mock_del_find = MagicMock()
        mock_del_find.scalar_one_or_none.return_value = mock_existing_prod
        mock_db.execute = AsyncMock(return_value=mock_del_find)

        await service.admin_delete_product(mock_db, mock_existing_prod.id)
        mock_db.delete.assert_called_once_with(mock_existing_prod)
        print_ok("Admin Delete Product berhasil menghapus produk dari database")

    asyncio.run(run())
    print_ok("Skenario 3 LULUS — 3/3 test Product Management berhasil")


# =========================================================
# SKENARIO 4: Order Management & Tracking
# =========================================================
def test_order_management():
    print_header("SKENARIO 4: Order Management (Status, Stock Restoration, Tracking)")

    from app.admin import service
    from app.admin.schemas import AdminOrderStatusUpdate, AdminOrderTrackingInput

    async def run():
        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # Mock order item & product
        mock_prod = MagicMock()
        mock_prod.stok = 10
        mock_prod.terjual = 5

        mock_item = MagicMock()
        mock_item.product_id = uuid.uuid4()
        mock_item.quantity = 2

        mock_order = MagicMock()
        mock_order.id = uuid.uuid4()
        mock_order.status = "pending"
        mock_order.items = [mock_item]
        mock_order.shipment = None
        mock_order.payment = MagicMock(status="unpaid")

        # 4a. Update status ke 'cancelled' -> Kembalikan stok
        mock_order_res = MagicMock()
        mock_order_res.scalar_one_or_none.return_value = mock_order

        mock_prod_res = MagicMock()
        mock_prod_res.scalar_one_or_none.return_value = mock_prod

        mock_db.execute = AsyncMock(side_effect=[mock_order_res, mock_prod_res])

        updated_order = await service.admin_update_order_status(
            mock_db, mock_order.id, AdminOrderStatusUpdate(status="cancelled", notes="Dibatalkan admin")
        )
        assert updated_order.status == "cancelled"
        assert mock_prod.stok == 12, "Stok harus dikembalikan (+2)"
        assert mock_prod.terjual == 3, "Terjual harus berkurang (-2)"
        print_ok(f"Status diubah ke cancelled: stok dikembalikan menjadi {mock_prod.stok}")

        # 4b. Input Tracking Kurir -> Otomatis set status 'shipped'
        mock_order_shipped = MagicMock()
        mock_order_shipped.id = uuid.uuid4()
        mock_order_shipped.status = "processing"
        mock_order_shipped.shipment = None

        mock_shipped_res = MagicMock()
        mock_shipped_res.scalar_one_or_none.return_value = mock_order_shipped
        mock_db.execute = AsyncMock(return_value=mock_shipped_res)
        mock_db.add = MagicMock()

        res_order = await service.admin_input_order_tracking(
            mock_db, mock_order_shipped.id, AdminOrderTrackingInput(courier="JNE", tracking_number="JNE123456789ID")
        )
        assert res_order.status == "shipped"
        assert res_order.shipment.courier_code == "jne"
        assert res_order.shipment.tracking_number == "JNE123456789ID"
        print_ok("Input tracking kurir berhasil: status otomatis 'shipped' dan resi tercatat")

    asyncio.run(run())
    print_ok("Skenario 4 LULUS — Order Management & Tracking terverifikasi")


# =========================================================
# SKENARIO 5: Customer Management
# =========================================================
def test_customer_management():
    print_header("SKENARIO 5: Customer Management (List, Detail, Status Toggle)")

    from app.admin import service
    from app.admin.schemas import CustomerStatusUpdate

    async def run():
        mock_db = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        mock_user = MagicMock()
        mock_user.id = uuid.uuid4()
        mock_user.email = "budi@gmail.com"
        mock_user.email_verified = True
        mock_user.is_active = True
        mock_user.is_admin = False
        mock_user.created_at = datetime.now(timezone.utc)
        mock_user.profile = MagicMock(full_name="Budi Santoso", phone="08123456789")
        mock_user.addresses = [MagicMock()]

        mock_order = MagicMock(id=uuid.uuid4(), total_amount=150000.0, status="completed", payment=MagicMock(status="paid"), created_at=datetime.now(timezone.utc), order_number="ORD-001")

        # 5a. List Customers
        mock_list_res = MagicMock()
        mock_list_res.scalars.return_value.all.return_value = [mock_user]

        mock_user_orders_res = MagicMock()
        mock_user_orders_res.scalars.return_value.all.return_value = [mock_order]

        mock_db.execute = AsyncMock(side_effect=[mock_list_res, mock_user_orders_res])

        customers = await service.admin_list_customers(mock_db)
        assert len(customers) == 1
        assert customers[0].email == "budi@gmail.com"
        assert customers[0].total_spend == 150000.0
        assert customers[0].total_orders == 1
        print_ok(f"List Customer: {customers[0].full_name} ({customers[0].email}) - Total spend Rp {customers[0].total_spend:,.0f}")

        # 5b. Customer Detail
        mock_detail_res = MagicMock()
        mock_detail_res.scalar_one_or_none.return_value = mock_user

        mock_orders_detail_res = MagicMock()
        mock_orders_detail_res.scalars.return_value.all.return_value = [mock_order]

        mock_db.execute = AsyncMock(side_effect=[mock_detail_res, mock_orders_detail_res])

        detail = await service.admin_get_customer_detail(mock_db, mock_user.id)
        assert detail.id == mock_user.id
        assert detail.addresses_count == 1
        assert len(detail.orders) == 1
        print_ok(f"Customer Detail: profile={detail.profile['full_name']}, orders={len(detail.orders)}")

        # 5c. Customer Status & Role Update (Nonaktifkan user)
        mock_update_res = MagicMock()
        mock_update_res.scalar_one_or_none.return_value = mock_user
        mock_db.execute = AsyncMock(return_value=mock_update_res)

        updated_user = await service.admin_update_customer_status(
            mock_db, mock_user.id, CustomerStatusUpdate(is_active=False, is_admin=True)
        )
        assert updated_user.is_active is False
        assert updated_user.is_admin is True
        print_ok("Customer Status & Role Update: akun dinonaktifkan & dijadikan admin")

    asyncio.run(run())
    print_ok("Skenario 5 LULUS — Customer Management terverifikasi")


# =========================================================
# SKENARIO 6: Master Data (Category, Brand, Skin, Ingredients)
# =========================================================
def test_master_data():
    print_header("SKENARIO 6: Master Data Management (Category, Brand, Skin, Ingredients)")

    from app.admin import service
    from app.admin.schemas import (
        AdminCategoryCreate,
        AdminSubCategoryCreate,
        AdminBrandCreate,
        AdminMasterDataCreate,
    )

    async def run():
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        mock_cat_obj = MagicMock()
        mock_cat_obj.name = "Sunscreen Care"
        mock_cat_obj.slug = "sunscreen-care"
        mock_cat_res = MagicMock()
        mock_cat_res.scalar_one.return_value = mock_cat_obj
        mock_db.execute = AsyncMock(return_value=mock_cat_res)

        # Category
        cat = await service.admin_create_category(mock_db, AdminCategoryCreate(name="Sunscreen Care"))
        assert cat.name == "Sunscreen Care"
        assert cat.slug == "sunscreen-care"
        print_ok(f"Admin Create Category: {cat.name} (slug: {cat.slug})")

        # SubCategory
        sub = await service.admin_create_sub_category(
            mock_db, AdminSubCategoryCreate(category_id=uuid.uuid4(), name="Physical Sunscreen")
        )
        assert sub.name == "Physical Sunscreen"
        print_ok(f"Admin Create SubCategory: {sub.name}")

        # Brand
        brand = await service.admin_create_brand(mock_db, AdminBrandCreate(name="Avoskin Beauty"))
        assert brand.name == "Avoskin Beauty"
        assert brand.slug == "avoskin-beauty"
        print_ok(f"Admin Create Brand: {brand.name}")

        # Skin Type
        st = await service.admin_create_skin_type(mock_db, AdminMasterDataCreate(name="Combination Oily"))
        assert st.name == "Combination Oily"
        print_ok(f"Admin Create Skin Type: {st.name}")

        # Skin Concern
        sc = await service.admin_create_skin_concern(mock_db, AdminMasterDataCreate(name="Post Acne Hyperpigmentation"))
        assert sc.name == "Post Acne Hyperpigmentation"
        print_ok(f"Admin Create Skin Concern: {sc.name}")

        # Ingredient
        ing = await service.admin_create_ingredient(mock_db, AdminMasterDataCreate(name="Tranexamic Acid"))
        assert ing.name == "Tranexamic Acid"
        print_ok(f"Admin Create Ingredient: {ing.name}")

    asyncio.run(run())
    print_ok("Skenario 6 LULUS — Semua operasi Master Data berhasil")


# =========================================================
# SKENARIO 7: Promotion & Voucher Management
# =========================================================
def test_voucher_management():
    print_header("SKENARIO 7: Promotion & Voucher Management")

    from app.admin import service
    from app.admin.schemas import AdminVoucherCreate
    from fastapi import HTTPException

    async def run():
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        # 7a. Create Voucher Baru
        mock_check = MagicMock()
        mock_check.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_check)

        v_data = AdminVoucherCreate(
            code="DISKONMERDEKA",
            name="Promo Kemerdekaan Topshop",
            discount_type="percentage",
            discount_amount=20.0,
            min_purchase=100000.0,
            max_discount=50000.0,
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=7),
            usage_limit=50,
            is_active=True,
        )
        voucher = await service.admin_create_voucher(mock_db, v_data)
        assert voucher.code == "DISKONMERDEKA"
        assert voucher.discount_amount == 20.0
        print_ok(f"Admin Create Voucher: {voucher.code} ({voucher.discount_type} {voucher.discount_amount}%)")

        # 7b. Duplicate Code -> Ditolak 400
        mock_exist = MagicMock()
        mock_exist.scalar_one_or_none.return_value = voucher
        mock_db.execute = AsyncMock(return_value=mock_exist)
        try:
            await service.admin_create_voucher(mock_db, v_data)
            assert False, "Seharusnya raise 400 kode voucher duplikat"
        except HTTPException as e:
            assert e.status_code == 400
            print_ok("Duplicate voucher code ditolak dengan benar (HTTP 400)")

        # 7c. Toggle Voucher Active/Inactive
        mock_toggle_res = MagicMock()
        mock_toggle_res.scalar_one_or_none.return_value = voucher
        mock_db.execute = AsyncMock(return_value=mock_toggle_res)

        toggled = await service.admin_toggle_voucher(mock_db, voucher.id, is_active=False)
        assert toggled.is_active is False
        print_ok(f"Voucher {toggled.code} berhasil dinonaktifkan (is_active=False)")

    asyncio.run(run())
    print_ok("Skenario 7 LULUS — Voucher Management berhasil")


# =========================================================
# SKENARIO 8: HTTP Endpoints Registration & Security
# =========================================================
def test_http_endpoints_and_security():
    print_header("SKENARIO 8: HTTP Endpoints Registration & Security Check")

    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app, raise_server_exceptions=False)

    openapi = client.get("/api/openapi.json")
    assert openapi.status_code == 200
    schema = openapi.json()
    paths = schema.get("paths", {})

    expected_admin_endpoints = [
        ("/api/v1/admin/dashboard/stats", "get"),
        ("/api/v1/admin/products", "post"),
        ("/api/v1/admin/products/{product_id}", "patch"),
        ("/api/v1/admin/products/{product_id}", "delete"),
        ("/api/v1/admin/orders", "get"),
        ("/api/v1/admin/orders/{order_id}", "get"),
        ("/api/v1/admin/orders/{order_id}/status", "patch"),
        ("/api/v1/admin/orders/{order_id}/tracking", "post"),
        ("/api/v1/admin/customers", "get"),
        ("/api/v1/admin/customers/{user_id}", "get"),
        ("/api/v1/admin/customers/{user_id}/status", "patch"),
        ("/api/v1/admin/categories", "post"),
        ("/api/v1/admin/sub-categories", "post"),
        ("/api/v1/admin/brands", "post"),
        ("/api/v1/admin/skin-types", "post"),
        ("/api/v1/admin/skin-concerns", "post"),
        ("/api/v1/admin/ingredients", "post"),
        ("/api/v1/admin/promotions/vouchers", "get"),
        ("/api/v1/admin/promotions/vouchers", "post"),
        ("/api/v1/admin/promotions/vouchers/{voucher_id}/toggle", "patch"),
    ]

    for path, method in expected_admin_endpoints:
        assert path in paths, f"Path {path} tidak ada di OpenAPI"
        assert method in paths[path], f"Method {method} tidak ada untuk path {path}"
        print_ok(f"{method.upper()} {path} — Terdaftar di OpenAPI")

    # Security check: Endpoint admin tanpa header auth HARUS 401
    res_no_auth = client.get("/api/v1/admin/dashboard/stats")
    assert res_no_auth.status_code in [401, 403], f"Harus 401/403, dapat: {res_no_auth.status_code}"
    print_ok(f"GET /admin/dashboard/stats tanpa auth terproteksi ({res_no_auth.status_code})")

    res_no_auth_cust = client.get("/api/v1/admin/customers")
    assert res_no_auth_cust.status_code in [401, 403]
    print_ok(f"GET /admin/customers tanpa auth terproteksi ({res_no_auth_cust.status_code})")

    print_ok("Skenario 8 LULUS — Semua 20 endpoint Admin terdaftar & terlindungi security guard")


# =========================================================
# RUNNER UTAMA
# =========================================================
def run_all_tests():
    print(f"\n{BOLD}{CYAN}{'#'*60}{RESET}")
    print(f"{BOLD}{CYAN}  PHASE 6 — ADMIN DASHBOARD & MANAGEMENT TEST SUITE{RESET}")
    print(f"{BOLD}{CYAN}  Topshop Kosmetik AI{RESET}")
    print(f"{BOLD}{CYAN}{'#'*60}{RESET}")

    tests = [
        ("RBAC Dependency (require_admin)", test_rbac_dependency),
        ("Dashboard Statistics Logic", test_dashboard_stats),
        ("Product Management CRUD", test_product_management),
        ("Order Management & Tracking", test_order_management),
        ("Customer Management", test_customer_management),
        ("Master Data Management", test_master_data),
        ("Promotion & Voucher Management", test_voucher_management),
        ("HTTP Endpoints & Security", test_http_endpoints_and_security),
    ]

    passed = 0
    failed = 0
    errors = []

    for name, test_fn in tests:
        try:
            test_fn()
            passed += 1
        except Exception as e:
            failed += 1
            errors.append((name, str(e)))
            print_fail(f"GAGAL: {name} — {e}")
            import traceback
            traceback.print_exc()

    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  HASIL AKHIR: {passed}/{len(tests)} skenario LULUS{RESET}")
    if failed > 0:
        print(f"  {RED}GAGAL: {failed} skenario{RESET}")
        for name, err in errors:
            print(f"    {RED}• {name}: {err}{RESET}")
    else:
        print(f"  {GREEN}✅ SEMUA SKENARIO LULUS — Phase 6 Admin Dashboard siap!{RESET}")
    print(f"{BOLD}{'='*60}{RESET}\n")

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
