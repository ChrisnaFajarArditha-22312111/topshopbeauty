"""
service.py — Business logic Ulasan & Rating Produk (Reviews)
Sesuai PRD: Ulasan hanya dapat dilakukan terhadap produk yang benar-benar pernah dibeli.
"""
import uuid
from typing import List
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.orders.models import Order, OrderItem, Review
from app.products.models import Product
from app.profiles.models import Profile
from app.reviews.schemas import (
    CreateReviewRequest,
    ReviewResponse,
    ProductReviewsSummaryResponse,
)


async def create_product_review(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: CreateReviewRequest,
) -> ReviewResponse:
    """
    Membuat review dan rating baru untuk produk yang telah dibeli.
    Validasi:
    1. OrderItem milik user
    2. Order harus sudah berstatus 'completed' atau 'shipped'
    3. Belum pernah direview sebelumnya
    4. Update rating agregat produk
    """
    stmt = (
        select(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .where(OrderItem.id == data.order_item_id, Order.user_id == user_id)
    )
    res = await db.execute(stmt)
    order_item = res.scalar_one_or_none()
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rincian pesanan tidak ditemukan atau bukan milik Anda",
        )

    # Ambil order untuk cek status
    o_stmt = select(Order).where(Order.id == order_item.order_id)
    o_res = await db.execute(o_stmt)
    order = o_res.scalar_one()
    if order.status not in ["completed", "shipped", "paid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ulasan hanya dapat diberikan untuk produk dari pesanan yang sudah dibayar/selesai",
        )

    # Cek apakah sudah pernah direview
    r_stmt = select(Review).where(Review.order_item_id == data.order_item_id)
    r_res = await db.execute(r_stmt)
    if r_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Produk pada item pesanan ini sudah pernah Anda beri ulasan",
        )

    review = Review(
        order_item_id=data.order_item_id,
        product_id=order_item.product_id,
        user_id=user_id,
        rating=data.rating,
        comment=data.comment,
        photo_url=data.photo_url,
    )
    db.add(review)
    await db.flush()

    # Recalculate Product average rating
    avg_stmt = select(func.avg(Review.rating)).where(Review.product_id == order_item.product_id)
    avg_res = await db.execute(avg_stmt)
    new_avg = avg_res.scalar() or data.rating

    prod_stmt = select(Product).where(Product.id == order_item.product_id)
    prod_res = await db.execute(prod_stmt)
    product = prod_res.scalar_one_or_none()
    if product:
        product.rating = round(float(new_avg), 1)

    await db.commit()
    await db.refresh(review)

    # Ambil nama profil user
    prof_stmt = select(Profile).where(Profile.user_id == user_id)
    prof_res = await db.execute(prof_stmt)
    prof = prof_res.scalar_one_or_none()
    user_name = prof.full_name if prof else "Pelanggan Topshop"

    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_name=user_name,
        rating=review.rating,
        comment=review.comment,
        photo_url=review.photo_url,
        created_at=review.created_at,
    )


async def get_reviews_by_product_id(
    db: AsyncSession,
    product_id: uuid.UUID,
) -> ProductReviewsSummaryResponse:
    """Mengambil seluruh ulasan untuk suatu produk beserta rating rata-rata."""
    stmt = (
        select(Review)
        .where(Review.product_id == product_id)
        .order_by(desc(Review.created_at))
    )
    res = await db.execute(stmt)
    reviews = res.scalars().all()

    review_responses = []
    total_rating = 0
    for r in reviews:
        total_rating += r.rating
        prof_stmt = select(Profile).where(Profile.user_id == r.user_id)
        prof_res = await db.execute(prof_stmt)
        prof = prof_res.scalar_one_or_none()
        u_name = prof.full_name if prof else "Pelanggan Topshop"

        review_responses.append(
            ReviewResponse(
                id=r.id,
                product_id=r.product_id,
                user_id=r.user_id,
                user_name=u_name,
                rating=r.rating,
                comment=r.comment,
                photo_url=r.photo_url,
                created_at=r.created_at,
            )
        )

    avg_rating = round(total_rating / len(reviews), 1) if reviews else 5.0

    return ProductReviewsSummaryResponse(
        product_id=product_id,
        average_rating=avg_rating,
        total_reviews=len(reviews),
        reviews=review_responses,
    )


async def get_user_reviews(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> List[ReviewResponse]:
    """Mengambil riwayat ulasan yang pernah ditulis oleh user."""
    stmt = (
        select(Review)
        .where(Review.user_id == user_id)
        .order_by(desc(Review.created_at))
    )
    res = await db.execute(stmt)
    reviews = res.scalars().all()

    prof_stmt = select(Profile).where(Profile.user_id == user_id)
    prof_res = await db.execute(prof_stmt)
    prof = prof_res.scalar_one_or_none()
    u_name = prof.full_name if prof else "Pelanggan Topshop"

    return [
        ReviewResponse(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            user_name=u_name,
            rating=r.rating,
            comment=r.comment,
            photo_url=r.photo_url,
            created_at=r.created_at,
        )
        for r in reviews
    ]
