"""Satu sumber batasan katalog untuk SQL dan pencarian semantik."""
import re
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.products.models import Product, Category, SubCategory, SkinType, SkinConcern
from app.beauty_advisor.recommendation.analyzer import QueryAnalysisResult

SUBCATEGORIES = {
    "Sunscreen": ["Sunscreen"],
    "Serum": ["Serum & Ampoule"],
    "Toner": ["Toner & Essence"],
    "Moisturizer": ["Moisturizer"],
    "Cleanser": ["Facial Wash", "Makeup Remover & Cleanser"],
    "Mask": ["Face Mask & Peeling"],
    "Lip": ["Lip Product"],
}
CATEGORIES = {"Skincare": "Skincare", "Make Up": "Makeup", "Body Care": "Body Care", "Hair Care": "Hair Care"}


def eligible_products(analysis: QueryAnalysisResult, category_id: str | None = None):
    """Semua jalur menjaga kategori, harga, stok, tipe kulit, dan concern yang sama."""
    stmt = select(Product).options(
        selectinload(Product.brand), selectinload(Product.category),
        selectinload(Product.sub_category), selectinload(Product.skin_types),
        selectinload(Product.skin_concerns), selectinload(Product.ingredients),
    ).where(Product.stok > 0)
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if analysis.min_price is not None:
        stmt = stmt.where(Product.harga >= analysis.min_price)
    if analysis.max_price is not None:
        stmt = stmt.where(Product.harga <= analysis.max_price)
    if analysis.product_category in SUBCATEGORIES:
        stmt = stmt.where(Product.sub_category.has(SubCategory.name.in_(SUBCATEGORIES[analysis.product_category])))
    elif analysis.product_category in CATEGORIES:
        stmt = stmt.where(Product.category.has(Category.name == CATEGORIES[analysis.product_category]))
    # Beberapa label impor terlalu luas; jangan tawarkan serum alis/krim sebagai serum wajah.
    target_other_area = bool(re.search(r"\b(?:bibir|lip|rambut|hair|badan|body|bulu mata|alis|lash|brow)\b", analysis.raw_query, re.IGNORECASE))
    if analysis.product_category in {"Serum", "Toner", "Moisturizer", "Sunscreen", "Cleanser"} and not target_other_area:
        excluded = r"\m(?:lash|brow|eyelash|eyebrow|lip|body|hair)\M"
        stmt = stmt.where(~Product.nama_produk.regexp_match(excluded, flags="i"))
    if analysis.product_category == "Serum":
        stmt = stmt.where(~Product.nama_produk.regexp_match(r"\m(?:cream|creme|krim)\M", flags="i"))
    if analysis.product_category == "Sunscreen":
        stmt = stmt.where(~Product.nama_produk.regexp_match(r"\m(?:foundation|cushion|bedak|powder)\M", flags="i"))
    if analysis.skin_type:
        names = [analysis.skin_type]
        # Tag umum bukan bukti khusus untuk kulit sensitif.
        if analysis.skin_type != "Sensitive":
            names.extend(["All Skin Types", "Semua Jenis Kulit"])
        stmt = stmt.where(Product.skin_types.any(SkinType.name.in_(names)))
    for concern in analysis.skin_concerns:
        stmt = stmt.where(Product.skin_concerns.any(SkinConcern.name.ilike(f"%{concern}%")))
    return stmt
