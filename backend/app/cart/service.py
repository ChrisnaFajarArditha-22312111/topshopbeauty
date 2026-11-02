"""
service.py — Business logic keranjang belanja (Cart) dan Wishlist
"""
import uuid
from typing import List
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.cart.models import Cart, CartItem
from app.wishlist.models import Wishlist
from app.products.models import Product
from app.cart.schemas import CartResponse, CartItemResponse, WishlistItemResponse


async def get_or_create_cart(db: AsyncSession, user_id: uuid.UUID) -> Cart:
    """Mengambil keranjang belanja aktif milik pengguna atau membuat baru."""
    stmt = (
        select(Cart)
        .options(selectinload(Cart.items).selectinload(CartItem.product))
        .where(Cart.user_id == user_id)
    )
    res = await db.execute(stmt)
    cart = res.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.commit()
        # Ambil ulang dengan relasi
        stmt = (
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .where(Cart.id == cart.id)
        )
        res = await db.execute(stmt)
        cart = res.scalar_one()
    return cart


async def get_cart_details(db: AsyncSession, user_id: uuid.UUID) -> CartResponse:
    """Mendapatkan rincian seluruh item di keranjang beserta total belanja."""
    cart = await get_or_create_cart(db, user_id)

    # Query CartItem langsung untuk memastikan data terupdate
    stmt = (
        select(CartItem)
        .options(selectinload(CartItem.product))
        .where(CartItem.cart_id == cart.id)
        .order_by(CartItem.created_at.asc())
    )
    res = await db.execute(stmt)
    items = res.scalars().all()

    item_responses = []
    total_price = 0.0
    total_items = 0

    for item in items:
        p = item.product
        item_subtotal = float(p.harga) * item.quantity
        total_price += item_subtotal
        total_items += item.quantity

        item_responses.append(
            CartItemResponse(
                id=item.id,
                product_id=p.id,
                nama_produk=p.nama_produk,
                price=float(p.harga),
                harga=float(p.harga),
                harga_asli=float(p.harga_asli) if p.harga_asli else None,
                foto_utama=p.foto_utama,
                stok=p.stok,
                quantity=item.quantity,
                subtotal=item_subtotal,
            )
        )

    return CartResponse(
        id=cart.id,
        items=item_responses,
        total_items=total_items,
        total_price=total_price,
    )



async def add_item_to_cart(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID, quantity: int) -> CartResponse:
    """Menambahkan produk ke keranjang belanja dengan validasi stok."""
    p_stmt = select(Product).where(Product.id == product_id)
    p_res = await db.execute(p_stmt)
    product = p_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produk tidak ditemukan")

    cart = await get_or_create_cart(db, user_id)

    # Cek apakah item sudah ada di cart
    item_stmt = select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id)
    i_res = await db.execute(item_stmt)
    cart_item = i_res.scalar_one_or_none()

    new_qty = (cart_item.quantity + quantity) if cart_item else quantity
    if product.stok < new_qty:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Stok produk tidak mencukupi (Tersisa {product.stok})")

    if cart_item:
        cart_item.quantity = new_qty
    else:
        cart_item = CartItem(cart_id=cart.id, product_id=product_id, quantity=new_qty)
        db.add(cart_item)

    await db.commit()
    return await get_cart_details(db, user_id)


async def update_cart_item(db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID, quantity: int) -> CartResponse:
    """Mengubah kuantitas item dalam keranjang."""
    cart = await get_or_create_cart(db, user_id)
    stmt = select(CartItem).options(selectinload(CartItem.product)).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item tidak ditemukan di keranjang")

    if item.product.stok < quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Stok produk tidak mencukupi (Tersisa {item.product.stok})")

    item.quantity = quantity
    await db.commit()
    return await get_cart_details(db, user_id)


async def remove_cart_item(db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID) -> CartResponse:
    """Menghapus item dari keranjang belanja."""
    cart = await get_or_create_cart(db, user_id)
    stmt = select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    res = await db.execute(stmt)
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item tidak ditemukan di keranjang")

    await db.delete(item)
    await db.commit()
    return await get_cart_details(db, user_id)


async def clear_cart(db: AsyncSession, user_id: uuid.UUID) -> CartResponse:
    """Mengosongkan seluruh isi keranjang belanja."""
    cart = await get_or_create_cart(db, user_id)
    stmt = select(CartItem).where(CartItem.cart_id == cart.id)
    res = await db.execute(stmt)
    items = res.scalars().all()
    for item in items:
        await db.delete(item)
    await db.commit()
    return await get_cart_details(db, user_id)




# =========================================================
# Wishlist Business Logic
# =========================================================

async def get_user_wishlist(db: AsyncSession, user_id: uuid.UUID) -> List[WishlistItemResponse]:
    """Mengambil seluruh item wishlist pengguna."""
    stmt = (
        select(Wishlist)
        .options(selectinload(Wishlist.product))
        .where(Wishlist.user_id == user_id)
        .order_by(Wishlist.created_at.desc())
    )
    res = await db.execute(stmt)
    items = res.scalars().all()
    return [
        WishlistItemResponse(
            id=w.id,
            product_id=w.product.id,
            nama_produk=w.product.nama_produk,
            price=float(w.product.harga),
            harga_asli=float(w.product.harga_asli) if w.product.harga_asli else None,
            foto_utama=w.product.foto_utama,
            stok=w.product.stok,
            rating=float(w.product.rating),
        )
        for w in items
    ]


async def add_to_wishlist(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> WishlistItemResponse:
    """Menambahkan produk ke wishlist."""
    # Cek produk
    p_stmt = select(Product).where(Product.id == product_id)
    p_res = await db.execute(p_stmt)
    product = p_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produk tidak ditemukan")

    # Cek jika sudah ada
    w_stmt = select(Wishlist).where(Wishlist.user_id == user_id, Wishlist.product_id == product_id)
    w_res = await db.execute(w_stmt)
    existing = w_res.scalar_one_or_none()
    if existing:
        return WishlistItemResponse(
            id=existing.id,
            product_id=product.id,
            nama_produk=product.nama_produk,
            price=float(product.harga),
            harga_asli=float(product.harga_asli) if product.harga_asli else None,
            foto_utama=product.foto_utama,
            stok=product.stok,
            rating=float(product.rating),
        )

    new_w = Wishlist(user_id=user_id, product_id=product_id)
    db.add(new_w)
    await db.commit()
    await db.refresh(new_w)

    return WishlistItemResponse(
        id=new_w.id,
        product_id=product.id,
        nama_produk=product.nama_produk,
        price=float(product.harga),
        harga_asli=float(product.harga_asli) if product.harga_asli else None,
        foto_utama=product.foto_utama,
        stok=product.stok,
        rating=float(product.rating),
    )


async def remove_from_wishlist(db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> None:
    """Menghapus produk dari wishlist."""
    stmt = select(Wishlist).where(Wishlist.user_id == user_id, Wishlist.product_id == product_id)
    res = await db.execute(stmt)
    w = res.scalar_one_or_none()
    if w:
        await db.delete(w)
        await db.commit()
