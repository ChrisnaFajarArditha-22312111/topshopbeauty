"""
service.py — Business logic Checkout, Orders, Vouchers, & Reviews
"""
import uuid
import random
import string
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.cart.models import Cart, CartItem
from app.cart.service import get_or_create_cart
from app.addresses.models import UserAddress
from app.promotions.models import Voucher
from app.products.models import Product
from app.users.models import User
from app.orders.models import Order, OrderItem, Payment, Shipment, Review
from app.payments.service import create_mayar_payment_invoice, verify_and_sync_mayar_payment
from app.shipping.service import calculate_biteship_rates
from app.orders.schemas import (
    CheckoutPreviewRequest,
    CheckoutPreviewResponse,
    CreateOrderRequest,
    OrderResponse,
    OrderItemResponse,
    PaymentInfoResponse,
    ShipmentInfoResponse,
    CreateReviewRequest,
    ReviewResponse,
)


def generate_order_number() -> str:
    """Format nomor order unik: TOP-YYYYMMDD-XXXXX"""
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_str = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"TOP-{date_str}-{random_str}"


async def validate_and_apply_voucher(
    db: AsyncSession,
    code: str,
    subtotal: float,
) -> Tuple[Optional[Voucher], float]:
    """Validasi kode voucher dan hitung nilai diskon."""
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voucher tidak valid atau sudah kedaluwarsa")

    if voucher.used_count >= voucher.usage_limit:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Kuota pemakaian voucher telah habis")

    if subtotal < float(voucher.min_purchase):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Minimal belanja untuk voucher ini adalah Rp {voucher.min_purchase:,.0f}")

    if voucher.discount_type == "percentage":
        discount = subtotal * (float(voucher.discount_amount) / 100.0)
        if voucher.max_discount and discount > float(voucher.max_discount):
            discount = float(voucher.max_discount)
    else:  # "fixed"
        discount = float(voucher.discount_amount)

    discount = min(discount, subtotal)
    return voucher, discount


async def preview_checkout(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: CheckoutPreviewRequest,
) -> CheckoutPreviewResponse:
    """Kalkulasi subtotal, diskon voucher, dan ongkir sebelum order dibuat."""
    cart = await get_or_create_cart(db, user_id)
    ci_stmt = (
        select(CartItem)
        .options(selectinload(CartItem.product))
        .where(CartItem.cart_id == cart.id)
    )
    ci_res = await db.execute(ci_stmt)
    cart_items = ci_res.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Keranjang belanja kosong")

    subtotal = sum(float(item.product.harga) * item.quantity for item in cart_items)
    item_count = sum(item.quantity for item in cart_items)


    # Ambil alamat
    addr_stmt = select(UserAddress).where(UserAddress.id == data.address_id, UserAddress.user_id == user_id)
    a_res = await db.execute(addr_stmt)
    address = a_res.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alamat pengiriman tidak valid")

    # Ambil ongkos kirim
    rates = await calculate_biteship_rates(address.postal_code, data.courier_code)
    selected_rate = next((r for r in rates if r.service_code.lower() == data.service_code.lower()), rates[0])
    shipping_cost = selected_rate.price

    # Hitung diskon voucher jika ada
    discount_amount = 0.0
    voucher_code_str = None
    if data.voucher_code:
        _, discount_amount = await validate_and_apply_voucher(db, data.voucher_code, subtotal)
        voucher_code_str = data.voucher_code.upper()

    total_amount = max(0.0, subtotal - discount_amount + shipping_cost)

    return CheckoutPreviewResponse(
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        discount_amount=discount_amount,
        total_amount=total_amount,
        item_count=item_count,
        voucher_applied=voucher_code_str,
    )


async def create_order_from_cart(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: CreateOrderRequest,
) -> Order:
    """
    Checkout keranjang belanja menjadi Order resmi,
    membuat Payment link Mayar, mengalokasikan Shipment Biteship,
    dan mengurangi stok produk.
    """
    cart = await get_or_create_cart(db, user_id)
    ci_stmt = (
        select(CartItem)
        .options(selectinload(CartItem.product))
        .where(CartItem.cart_id == cart.id)
    )
    ci_res = await db.execute(ci_stmt)
    cart_items = ci_res.scalars().all()
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Keranjang belanja kosong")

    # 1. Validasi stok semua item
    for item in cart_items:
        if item.product.stok < item.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Stok produk {item.product.nama_produk} tidak mencukupi")

    subtotal = sum(float(item.product.harga) * item.quantity for item in cart_items)

    # 2. Ambil data alamat
    addr_stmt = select(UserAddress).where(UserAddress.id == data.address_id, UserAddress.user_id == user_id)
    a_res = await db.execute(addr_stmt)
    address = a_res.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alamat tidak valid")

    # 3. Hitung tarif ongkos kirim
    rates = await calculate_biteship_rates(address.postal_code, data.courier_code)
    selected_rate = next((r for r in rates if r.service_code.lower() == data.service_code.lower()), rates[0])
    shipping_cost = selected_rate.price

    # 4. Potongan Voucher jika ada
    voucher_obj = None
    discount_amount = 0.0
    if data.voucher_code:
        voucher_obj, discount_amount = await validate_and_apply_voucher(db, data.voucher_code, subtotal)
        voucher_obj.used_count += 1

    total_amount = max(0.0, subtotal - discount_amount + shipping_cost)

    # 5. Buat Order Record
    order = Order(
        order_number=generate_order_number(),
        user_id=user_id,
        status="pending",
        subtotal=subtotal,
        discount_amount=discount_amount,
        shipping_cost=shipping_cost,
        total_amount=total_amount,
        voucher_id=voucher_obj.id if voucher_obj else None,
        shipping_recipient_name=address.recipient_name,
        shipping_phone=address.phone,
        shipping_address=f"{address.address}, {address.district}",
        shipping_city=address.city,
        shipping_postal_code=address.postal_code,
        shipping_courier=selected_rate.courier_name,
        shipping_service=selected_rate.service_name,
        customer_notes=data.customer_notes,
    )
    db.add(order)
    await db.flush()

    # 6. Pindahkan CartItem ke OrderItem & potong stok
    for item in cart_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.product.id,
            product_name=item.product.nama_produk,
            price=item.product.harga,
            quantity=item.quantity,
            subtotal=float(item.product.harga) * item.quantity,
        )
        db.add(order_item)
        item.product.stok -= item.quantity
        item.product.terjual += item.quantity
        await db.delete(item)


    # 7. Ambil data User untuk info pembayaran Mayar
    user_stmt = select(User).where(User.id == user_id)
    u_res = await db.execute(user_stmt)
    current_user_obj = u_res.scalar_one_or_none()
    user_email = current_user_obj.email if current_user_obj else ""

    # Buat Payment Record via Mayar (QRIS & VA Otomatis)
    selected_method = getattr(data, "payment_method", "mayar") or "mayar"
    mayar_info = await create_mayar_payment_invoice(order, user_email=user_email)
    payment = Payment(
        order_id=order.id,
        payment_method=selected_method,
        mayar_transaction_id=mayar_info.get("id"),
        mayar_payment_url=mayar_info.get("payment_url"),
        amount=total_amount,
        status="pending",
    )
    db.add(payment)

    # 8. Buat Shipment Record
    shipment = Shipment(
        order_id=order.id,
        courier_code=selected_rate.courier_code,
        service_code=selected_rate.service_code,
        shipping_status="pending_payment",
    )
    db.add(shipment)

    await db.commit()
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.payment),
            selectinload(Order.shipment),
        )
        .where(Order.id == order.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()



async def get_user_orders(db: AsyncSession, user_id: uuid.UUID) -> List[OrderResponse]:
    """Mengambil riwayat pesanan milik user."""
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payment),
            selectinload(Order.shipment),
        )
        .where(Order.user_id == user_id)
        .order_by(desc(Order.created_at))
    )
    res = await db.execute(stmt)
    orders = res.scalars().all()

    # Auto-sync status pesanan pending dengan Mayar API
    has_synced = False
    for o in orders:
        if o.status == "pending" and o.payment and o.payment.mayar_transaction_id and not o.payment.mayar_transaction_id.startswith("PAY-") and not o.payment.mayar_transaction_id.startswith("mayar_test_"):
            await verify_and_sync_mayar_payment(db, o.id, user_id)
            has_synced = True

    if has_synced:
        res = await db.execute(stmt)
        orders = res.scalars().all()

    result = []
    for o in orders:
        result.append(
            OrderResponse(
                id=o.id,
                order_number=o.order_number,
                status=o.status,
                subtotal=float(o.subtotal),
                discount_amount=float(o.discount_amount),
                shipping_cost=float(o.shipping_cost),
                total_amount=float(o.total_amount),
                shipping_recipient_name=o.shipping_recipient_name,
                shipping_phone=o.shipping_phone,
                shipping_address=o.shipping_address,
                shipping_city=o.shipping_city,
                shipping_courier=o.shipping_courier,
                shipping_service=o.shipping_service,
                created_at=o.created_at,
                items=[
                    OrderItemResponse(
                        id=it.id,
                        product_id=it.product_id,
                        product_name=it.product_name,
                        price=float(it.price),
                        quantity=it.quantity,
                        subtotal=float(it.subtotal),
                    )
                    for it in o.items
                ],
                payment=PaymentInfoResponse.model_validate(o.payment) if o.payment else None,
                shipment=ShipmentInfoResponse.model_validate(o.shipment) if o.shipment else None,
            )
        )
    return result


async def get_order_by_id(db: AsyncSession, user_id: uuid.UUID, order_id: uuid.UUID) -> OrderResponse:
    """Mengambil detail spesifik satu order milik user."""
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payment),
            selectinload(Order.shipment),
        )
        .where(Order.id == order_id, Order.user_id == user_id)
    )
    res = await db.execute(stmt)
    o = res.scalar_one_or_none()
    if not o:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pesanan tidak ditemukan",
        )

    # Auto-sync dengan Mayar API jika order masih pending
    if o.status == "pending" and o.payment and o.payment.mayar_transaction_id:
        await verify_and_sync_mayar_payment(db, order_id, user_id)
        # Refresh order status
        stmt_refresh = select(Order).options(
            selectinload(Order.items),
            selectinload(Order.payment),
            selectinload(Order.shipment),
        ).where(Order.id == order_id)
        res_refresh = await db.execute(stmt_refresh)
        o = res_refresh.scalar_one()

    return OrderResponse(
        id=o.id,
        order_number=o.order_number,
        status=o.status,
        subtotal=float(o.subtotal),
        discount_amount=float(o.discount_amount),
        shipping_cost=float(o.shipping_cost),
        total_amount=float(o.total_amount),
        shipping_recipient_name=o.shipping_recipient_name,
        shipping_phone=o.shipping_phone,
        shipping_address=o.shipping_address,
        shipping_city=o.shipping_city,
        shipping_courier=o.shipping_courier,
        shipping_service=o.shipping_service,
        created_at=o.created_at,
        items=[
            OrderItemResponse(
                id=it.id,
                product_id=it.product_id,
                product_name=it.product_name,
                price=float(it.price),
                quantity=it.quantity,
                subtotal=float(it.subtotal),
            )
            for it in o.items
        ],
        payment=PaymentInfoResponse.model_validate(o.payment) if o.payment else None,
        shipment=ShipmentInfoResponse.model_validate(o.shipment) if o.shipment else None,
    )


async def cancel_order(db: AsyncSession, user_id: uuid.UUID, order_id: uuid.UUID) -> OrderResponse:
    """
    Membatalkan pesanan yang berstatus 'pending'.
    Mengembalikan stok produk yang telah direservasi dan mengembalikan kuota voucher.
    """
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items).selectinload(OrderItem.product),
            selectinload(Order.payment),
            selectinload(Order.shipment),
        )
        .where(Order.id == order_id, Order.user_id == user_id)
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order tidak ditemukan")

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pesanan dengan status '{order.status}' tidak dapat dibatalkan",
        )

    order.status = "cancelled"
    if order.payment and order.payment.status == "pending":
        order.payment.status = "cancelled"

    # Kembalikan stok produk
    for item in order.items:
        if item.product:
            item.product.stok += item.quantity
            item.product.terjual = max(0, item.product.terjual - item.quantity)

    # Kembalikan kuota voucher jika dipakai
    if order.voucher_id:
        v_stmt = select(Voucher).where(Voucher.id == order.voucher_id)
        v_res = await db.execute(v_stmt)
        voucher = v_res.scalar_one_or_none()
        if voucher and voucher.used_count > 0:
            voucher.used_count -= 1

    # Kembalikan produk ke keranjang belanja pengguna
    cart = await get_or_create_cart(db, user_id)
    for item in order.items:
        ci_stmt = select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == item.product_id)
        ci_res = await db.execute(ci_stmt)
        existing_ci = ci_res.scalar_one_or_none()
        if existing_ci:
            existing_ci.quantity += item.quantity
        else:
            new_ci = CartItem(
                cart_id=cart.id,
                product_id=item.product_id,
                quantity=item.quantity,
            )
            db.add(new_ci)

    await db.commit()
    return await get_order_by_id(db, user_id, order_id)



# =========================================================
# Reviews Business Logic
# =========================================================

async def create_product_review(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: CreateReviewRequest,
) -> ReviewResponse:
    """
    Membuat review produk.
    Verifikasi bahwa user benar-benar telah membeli item ini dan pesanan selesai ('completed').
    """
    oi_stmt = (
        select(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .where(OrderItem.id == data.order_item_id, Order.user_id == user_id)
    )
    res = await db.execute(oi_stmt)
    order_item = res.scalar_one_or_none()
    if not order_item:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rincian pesanan tidak ditemukan")

    # Cek apakah sudah pernah direview
    r_stmt = select(Review).where(Review.order_item_id == data.order_item_id)
    r_res = await db.execute(r_stmt)
    if r_res.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Produk ini sudah pernah Anda beri ulasan")

    review = Review(
        order_item_id=data.order_item_id,
        product_id=order_item.product_id,
        user_id=user_id,
        rating=data.rating,
        comment=data.comment,
        photo_url=data.photo_url,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        rating=review.rating,
        comment=review.comment,
        photo_url=review.photo_url,
        created_at=review.created_at,
    )
