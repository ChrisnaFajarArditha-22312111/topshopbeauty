"""
service.py — Business logic untuk Wishlist Produk Pengguna
"""
import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.wishlist.models import Wishlist
from app.products.models import Product
from app.wishlist.schemas import WishlistItemResponse
from app.cart.models import Cart, CartItem
from app.cart.service import get_or_create_cart, add_item_to_cart, get_cart_details
from app.cart.schemas import CartResponse


async def get_user_wishlist(db: AsyncSession, user_id: uuid.UUID) -> List[WishlistItemResponse]:
    """Mengambil seluruh item wishlist milik pengguna."""
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
    """Menambahkan produk ke wishlist pengguna."""
    # Cek keberadaan produk
    p_stmt = select(Product).where(Product.id == product_id)
    p_res = await db.execute(p_stmt)
    product = p_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produk tidak ditemukan")

    # Cek apakah sudah ada di wishlist
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
    """Menghapus produk dari wishlist pengguna."""
    stmt = select(Wishlist).where(Wishlist.user_id == user_id, Wishlist.product_id == product_id)
    res = await db.execute(stmt)
    w = res.scalar_one_or_none()
    if w:
        await db.delete(w)
        await db.commit()


async def move_wishlist_to_cart(
    db: AsyncSession,
    user_id: uuid.UUID,
    product_id: uuid.UUID,
    quantity: int = 1,
) -> CartResponse:
    """Memindahkan produk dari wishlist ke keranjang belanja (PRD line 793)."""
    # 1. Tambah ke keranjang belanja
    cart_res = await add_item_to_cart(db, user_id, product_id, quantity)

    # 2. Hapus dari wishlist
    await remove_from_wishlist(db, user_id, product_id)

    return cart_res
