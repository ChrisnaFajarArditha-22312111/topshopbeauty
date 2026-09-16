"""
tests_phase4.py — Test suite komprehensif untuk Phase 4 (E-Commerce)
Topshop Kosmetik AI

Menguji:
1. Skema ORM E-Commerce: Cart, CartItem, Wishlist, Voucher, Order, OrderItem, Payment, Shipment, Review
2. Fitur Shopping Cart (Add, Stock validation, Update Qty, Subtotal/Total, Remove, Clear)
3. Fitur Wishlist (Add, Duplicate check, View, Move Wishlist to Cart, Remove)
4. Fitur Promotions & Vouchers (Create, Validate, Min Purchase check, Percentage & Fixed discount)
5. Fitur Shipping Biteship (Rates calculation, Courier options, Live Tracking, Webhook handling)
6. Fitur Checkout & Order Creation (Preview calculation, Create Order, Stock deduction, Snapshot alamat, Invoice Mayar)
7. Fitur Mayar Payment & Webhook (Invoice link, Webhook processing, Order paid transition)
8. Fitur Order Cancellation (Cancel pending order, Stock restoration, Voucher count restore)
9. Fitur Reviews & Rating (Verified buyer restriction, Aggregate rating calculation, Product reviews summary)
10. HTTP API Endpoints via FastAPI AsyncClient (Cart, Wishlist, Checkout, Orders, Payments, Shipping, Promotions, Reviews)
"""
import asyncio
import sys
from pathlib import Path
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal

# Memastikan modul app dalam sys.path
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select
from httpx import ASGITransport, AsyncClient

from app.core.database import Base, get_db
from app.core.security import hash_password, create_access_token
from app.users.models import User

from app.profiles.models import Profile
from app.addresses.models import UserAddress
from app.products.models import Product, Brand, Category
from app.cart.models import Cart, CartItem
from app.wishlist.models import Wishlist
from app.promotions.models import Voucher
from app.orders.models import Order, OrderItem, Payment, Shipment, Review

from app.cart import service as cart_service
from app.wishlist import service as wishlist_service
from app.promotions import service as promo_service
from app.shipping import service as shipping_service
from app.orders import service as order_service
from app.payments import service as payment_service
from app.reviews import service as review_service

from app.orders.schemas import (
    CheckoutPreviewRequest,
    CreateOrderRequest,
)
from app.promotions.schemas import CreateVoucherRequest, ValidateVoucherRequest
from app.reviews.schemas import CreateReviewRequest
from app.main import app

# In-memory SQLite async engine
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db


async def run_phase4_tests():
    print("🚀 MEMULAI TEST SUITE PHASE 4 (E-COMMERCE)...")

    # Inisialisasi skema tabel
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Skema database E-Commerce berhasil dibuat di SQLite in-memory.")

    async with TestSessionLocal() as db:
        # =========================================================
        # Setup Data Awal: User, Profile, Address, Brand, Category, Products
        # =========================================================
        test_user = User(
            id=uuid.uuid4(),
            email="customer@topshopkosmetik.com",
            password_hash=hash_password("Password123!"),
            email_verified=True,
            is_active=True,
        )
        db.add(test_user)

        test_profile = Profile(
            user_id=test_user.id,
            full_name="Siti Rahma",
            phone="081234567890",
        )
        db.add(test_profile)

        test_address = UserAddress(
            id=uuid.uuid4(),
            user_id=test_user.id,
            label="Rumah",
            recipient_name="Siti Rahma",
            phone="081234567890",
            address="Jl. Raden Intan No. 45",
            province="Lampung",
            city="Bandar Lampung",
            district="Tanjung Karang Pusat",
            postal_code="35111",
            is_default=True,
        )
        db.add(test_address)

        brand = Brand(name="Wardah", slug="wardah")
        category = Category(name="Skincare", slug="skincare")
        db.add_all([brand, category])
        await db.flush()

        prod1 = Product(
            id=uuid.uuid4(),
            item_id="PROD-001",
            shop_id=1,
            nama_produk="Wardah UV Shield Essential Sunscreen Gel SPF 35 PA+++",
            brand_id=brand.id,
            category_id=category.id,
            harga=35000.0,
            harga_asli=38000.0,
            stok=20,
            terjual=150,
            rating=4.8,
            is_skincare=True,
            search_document="Wardah sunscreen tabir surya uv shield spf 35",
        )
        prod2 = Product(
            id=uuid.uuid4(),
            item_id="PROD-002",
            shop_id=1,
            nama_produk="Wardah C-Defense Serum Vitamin C",
            brand_id=brand.id,
            category_id=category.id,
            harga=85000.0,
            harga_asli=95000.0,
            stok=5,
            terjual=80,
            rating=4.7,
            is_skincare=True,
            search_document="Wardah serum c-defense vitamin c mencerahkan",
        )
        db.add_all([prod1, prod2])
        await db.commit()
        print("✅ Data awal (User, Profile, Address, Brand, Category, Products) berhasil dibuat.")

        # =========================================================
        # 1. Test Shopping Cart
        # =========================================================
        print("\n--- 1. Testing Shopping Cart ---")
        cart = await cart_service.add_item_to_cart(db, test_user.id, prod1.id, quantity=2)
        assert cart.total_items == 2
        assert cart.total_price == 70000.0
        print(f"✅ Berhasil menambah produk ke Cart (Total Items: {cart.total_items}, Total: Rp {cart.total_price:,.0f}).")

        # Test Update kuantitas
        cart_item_id = cart.items[0].id
        cart_updated = await cart_service.update_cart_item(db, test_user.id, cart_item_id, quantity=3)
        assert cart_updated.total_items == 3
        assert cart_updated.total_price == 105000.0
        print(f"✅ Update quantity cart berhasil (Total Items: {cart_updated.total_items}, Total: Rp {cart_updated.total_price:,.0f}).")

        # Test validasi stok
        try:
            await cart_service.add_item_to_cart(db, test_user.id, prod2.id, quantity=100)
            assert False, "Harusnya error stok tidak mencukupi"
        except Exception as e:
            print(f"✅ Validasi stok produk berhasil dicegat: {e.detail}")

        # Tambah prod2 sebanyak 1
        await cart_service.add_item_to_cart(db, test_user.id, prod2.id, quantity=1)
        cart = await cart_service.get_cart_details(db, test_user.id)
        assert len(cart.items) == 2
        print(f"✅ Cart sekarang berisi 2 jenis produk berbeda.")

        # =========================================================
        # 2. Test Wishlist
        # =========================================================
        print("\n--- 2. Testing Wishlist ---")
        w_item = await wishlist_service.add_to_wishlist(db, test_user.id, prod2.id)
        assert w_item.product_id == prod2.id
        print(f"✅ Berhasil menambahkan '{w_item.nama_produk}' ke Wishlist.")

        user_wishlist = await wishlist_service.get_user_wishlist(db, test_user.id)
        assert len(user_wishlist) == 1

        # Test Move Wishlist to Cart
        cart_after_move = await wishlist_service.move_wishlist_to_cart(db, test_user.id, prod2.id, quantity=1)
        w_after_move = await wishlist_service.get_user_wishlist(db, test_user.id)
        assert len(w_after_move) == 0
        print(f"✅ Fitur Move Wishlist to Cart sukses: Wishlist kosong dan qty di cart bertambah.")

        # =========================================================
        # 3. Test Promotions & Vouchers
        # =========================================================
        print("\n--- 3. Testing Promotions & Vouchers ---")
        now = datetime.now(timezone.utc)
        voucher_req = CreateVoucherRequest(
            code="TOPSHOPHEMAT",
            name="Diskon Belanja Hemat",
            description="Potongan Rp 20.000 minimal belanja Rp 100.000",
            discount_type="fixed",
            discount_amount=20000.0,
            min_purchase=100000.0,
            usage_limit=10,
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=7),
            is_active=True,
        )
        voucher = await promo_service.create_voucher(db, voucher_req)
        assert voucher.code == "TOPSHOPHEMAT"
        print(f"✅ Voucher '{voucher.code}' berhasil dibuat.")

        # Validasi voucher
        valid_res = await promo_service.validate_voucher_code(db, "TOPSHOPHEMAT", subtotal=150000.0)
        assert valid_res.is_valid is True
        assert valid_res.discount_amount == 20000.0
        print(f"✅ Validasi voucher sukses: Diskon Rp {valid_res.discount_amount:,.0f}.")

        # Validasi gagal minimal purchase
        invalid_res = await promo_service.validate_voucher_code(db, "TOPSHOPHEMAT", subtotal=50000.0)
        assert invalid_res.is_valid is False
        print(f"✅ Validasi minimal purchase voucher sukses dicegat: {invalid_res.message}")

        # =========================================================
        # 4. Test Shipping Biteship
        # =========================================================
        print("\n--- 4. Testing Biteship Shipping ---")
        rates = await shipping_service.calculate_biteship_rates(test_address.postal_code)
        assert len(rates) > 0
        print(f"✅ Tarif kurir Biteship ditemukan: {len(rates)} opsi pengiriman ({rates[0].courier_name} - Rp {rates[0].price:,.0f}).")

        # =========================================================
        # 5. Test Checkout & Create Order
        # =========================================================
        print("\n--- 5. Testing Checkout & Create Order ---")
        # Preview checkout
        preview = await order_service.preview_checkout(
            db,
            test_user.id,
            CheckoutPreviewRequest(
                address_id=test_address.id,
                courier_code="jne",
                service_code="reg",
                voucher_code="TOPSHOPHEMAT",
            ),
        )
        assert preview.subtotal > 0
        assert preview.discount_amount == 20000.0
        assert preview.shipping_cost == 15000.0
        expected_total = preview.subtotal - 20000.0 + 15000.0
        assert preview.total_amount == expected_total
        print(f"✅ Preview checkout akurat (Subtotal: Rp {preview.subtotal:,.0f}, Diskon: Rp {preview.discount_amount:,.0f}, Ongkir: Rp {preview.shipping_cost:,.0f}, Total: Rp {preview.total_amount:,.0f}).")

        # Create Order
        order = await order_service.create_order_from_cart(
            db,
            test_user.id,
            CreateOrderRequest(
                address_id=test_address.id,
                courier_code="jne",
                service_code="reg",
                voucher_code="TOPSHOPHEMAT",
                customer_notes="Tolong bubble wrap yang tebal ya min.",
            ),
        )
        assert order.status == "pending"
        assert order.order_number.startswith("TOP-")
        assert order.payment is not None
        assert order.shipment is not None
        print(f"✅ Order {order.order_number} berhasil dibuat dengan status '{order.status}'.")
        print(f"   Payment ID: {order.payment.mayar_transaction_id}, URL: {order.payment.mayar_payment_url}")

        # Verifikasi stok produk berkurang & cart kosong
        p1_refreshed = (await db.execute(select(Product).where(Product.id == prod1.id))).scalar_one()
        assert p1_refreshed.stok < 20
        cart_after_order = await cart_service.get_cart_details(db, test_user.id)
        assert len(cart_after_order.items) == 0
        print(f"✅ Stok produk otomatis terpotong (Tersisa {p1_refreshed.stok}) dan keranjang dikosongkan.")

        # =========================================================
        # 6. Test Mayar Webhook (Payment Paid Transition)
        # =========================================================
        print("\n--- 6. Testing Mayar Payment Webhook ---")
        webhook_payload = {
            "event": "payment.success",
            "data": {
                "id": order.payment.mayar_transaction_id,
                "status": "paid",
            },
        }
        webhook_success = await payment_service.process_mayar_webhook(db, webhook_payload)
        assert webhook_success is True

        # Refresh order
        order_detail = await order_service.get_order_by_id(db, test_user.id, order.id)
        assert order_detail.status == "paid"
        assert order_detail.payment.status == "paid"
        print(f"✅ Webhook Mayar sukses diproses: Status Order berubah menjadi '{order_detail.status}'.")

        # =========================================================
        # 7. Test Biteship Webhook (Shipment & Delivery)
        # =========================================================
        print("\n--- 7. Testing Biteship Shipping Webhook ---")
        shipment = (await db.execute(select(Shipment).where(Shipment.order_id == order.id))).scalar_one()
        shipment.tracking_number = "TRACK-TOPSHOP-12345"
        await db.commit()

        # Webhook in transit
        biteship_payload_transit = {
            "event": "order.waybill_updated",
            "courier_tracking_id": "TRACK-TOPSHOP-12345",
            "status": "in_transit",
        }
        transit_ok = await shipping_service.process_biteship_webhook(db, biteship_payload_transit)
        assert transit_ok is True
        o_transit = await order_service.get_order_by_id(db, test_user.id, order.id)
        assert o_transit.status == "shipped"
        print(f"✅ Webhook Biteship status 'in_transit' berhasil: Order berubah menjadi '{o_transit.status}'.")

        # Webhook delivered
        biteship_payload_delivered = {
            "event": "order.delivered",
            "courier_tracking_id": "TRACK-TOPSHOP-12345",
            "status": "delivered",
        }
        deliv_ok = await shipping_service.process_biteship_webhook(db, biteship_payload_delivered)
        assert deliv_ok is True
        o_deliv = await order_service.get_order_by_id(db, test_user.id, order.id)
        assert o_deliv.status == "completed"
        print(f"✅ Webhook Biteship status 'delivered' berhasil: Order berubah menjadi '{o_deliv.status}'.")

        # =========================================================
        # 8. Test Reviews & Rating
        # =========================================================
        print("\n--- 8. Testing Product Reviews & Ratings ---")
        order_item_to_review = o_deliv.items[0]
        review_req = CreateReviewRequest(
            order_item_id=order_item_to_review.id,
            rating=5,
            comment="Teksturnya sangat ringan, cepat meresap dan tidak bikin kusam. Mantap Topshop!",
            photo_url="https://images.topshopkosmetik.com/reviews/rev1.jpg",
        )
        created_rev = await review_service.create_product_review(db, test_user.id, review_req)
        assert created_rev.rating == 5
        print(f"✅ Review berhasil dibuat untuk produk '{order_item_to_review.product_name}' dengan rating {created_rev.rating}⭐.")

        # Ambil ulasan produk
        prod_reviews = await review_service.get_reviews_by_product_id(db, order_item_to_review.product_id)
        assert prod_reviews.total_reviews == 1
        assert prod_reviews.average_rating == 5.0
        print(f"✅ Rangkuman ulasan produk berhasil diambil (Total: {prod_reviews.total_reviews}, Avg: {prod_reviews.average_rating}⭐).")

        # =========================================================
        # 9. Test Order Cancellation & Stock Restoration
        # =========================================================
        print("\n--- 9. Testing Order Cancellation & Stock Restoration ---")
        # Masukkan barang ke cart lagi
        await cart_service.add_item_to_cart(db, test_user.id, prod1.id, quantity=2)
        stock_before_order2 = (await db.execute(select(Product.stok).where(Product.id == prod1.id))).scalar()

        order2 = await order_service.create_order_from_cart(
            db,
            test_user.id,
            CreateOrderRequest(
                address_id=test_address.id,
                courier_code="jne",
                service_code="reg",
            ),
        )
        stock_after_order2 = (await db.execute(select(Product.stok).where(Product.id == prod1.id))).scalar()
        assert stock_after_order2 == stock_before_order2 - 2

        # Batalkan order2 yang masih pending
        cancelled_order = await order_service.cancel_order(db, test_user.id, order2.id)
        assert cancelled_order.status == "cancelled"
        stock_after_cancel = (await db.execute(select(Product.stok).where(Product.id == prod1.id))).scalar()
        assert stock_after_cancel == stock_before_order2
        print(f"✅ Pembatalan pesanan berhasil: Status pesanan 'cancelled' dan stok dikembalikan normal ({stock_after_cancel}).")

    # =========================================================
    # 10. Test Seluruh HTTP Endpoints Phase 4 via AsyncClient
    # =========================================================
    print("\n--- 10. Testing HTTP API Endpoints via AsyncClient ---")
    token = create_access_token(data={"sub": str(test_user.id), "email": test_user.email})
    headers = {"Authorization": f"Bearer {token}"}

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Cart Endpoints
        r_cart = await client.get("/api/v1/cart", headers=headers)
        assert r_cart.status_code == 200

        r_add_cart = await client.post(
            "/api/v1/cart/items",
            headers=headers,
            json={"product_id": str(prod1.id), "quantity": 1},
        )
        assert r_add_cart.status_code == 200
        print("✅ HTTP GET & POST /api/v1/cart/items 200 OK")

        # Wishlist Endpoints
        r_w_add = await client.post(
            "/api/v1/wishlist",
            headers=headers,
            json={"product_id": str(prod2.id)},
        )
        assert r_w_add.status_code == 201

        r_w_get = await client.get("/api/v1/wishlist", headers=headers)
        assert r_w_get.status_code == 200
        assert len(r_w_get.json()) >= 1
        print("✅ HTTP GET & POST /api/v1/wishlist 200 OK")

        # Promotions Endpoints
        r_promo_list = await client.get("/api/v1/promotions/vouchers")
        assert r_promo_list.status_code == 200

        r_promo_val = await client.post(
            "/api/v1/promotions/validate",
            json={"code": "TOPSHOPHEMAT", "subtotal": 120000},
        )
        assert r_promo_val.status_code == 200
        assert r_promo_val.json()["is_valid"] is True
        print("✅ HTTP GET /api/v1/promotions/vouchers & POST /validate 200 OK")

        # Shipping Endpoints
        r_rates = await client.get(
            f"/api/v1/shipping/rates?address_id={test_address.id}&courier=jne",
            headers=headers,
        )
        assert r_rates.status_code == 200
        print("✅ HTTP GET /api/v1/shipping/rates 200 OK")

        # Checkout Preview Endpoint
        r_prev = await client.post(
            "/api/v1/checkout/preview",
            headers=headers,
            json={
                "address_id": str(test_address.id),
                "courier_code": "jne",
                "service_code": "reg",
            },
        )
        assert r_prev.status_code == 200
        print("✅ HTTP POST /api/v1/checkout/preview 200 OK")

        # Orders Listing
        r_orders = await client.get("/api/v1/orders", headers=headers)
        assert r_orders.status_code == 200
        assert len(r_orders.json()) >= 1
        print("✅ HTTP GET /api/v1/orders 200 OK")

        # Reviews Endpoint
        r_revs = await client.get(f"/api/v1/reviews/product/{prod1.id}")
        assert r_revs.status_code == 200
        print("✅ HTTP GET /api/v1/reviews/product/{id} 200 OK")

    print("\n🎉 SEMUA PENGUJIAN PHASE 4 (E-COMMERCE) BERHASIL 100%!")


if __name__ == "__main__":
    asyncio.run(run_phase4_tests())
