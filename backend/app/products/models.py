"""
models.py — Model database untuk Produk dan relasi E-Commerce
Sesuai PRD Topshop Kosmetik AI
Mendukung pgvector embedding, multi-relasi skin type, skin concern, ingredient, images.
"""
import uuid
from typing import Optional, List
from sqlalchemy import (
    String,
    Integer,
    BigInteger,
    Numeric,
    Boolean,
    Text,
    ForeignKey,
    Table,
    Column,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

from app.core.database import Base
from app.core.models_base import TimestampMixin

# =========================================================
# Association Tables (Many-to-Many)
# =========================================================

product_skin_types = Table(
    "product_skin_types",
    Base.metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("skin_type_id", UUID(as_uuid=True), ForeignKey("skin_types.id", ondelete="CASCADE"), primary_key=True),
)

product_skin_concerns = Table(
    "product_skin_concerns",
    Base.metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("skin_concern_id", UUID(as_uuid=True), ForeignKey("skin_concerns.id", ondelete="CASCADE"), primary_key=True),
)

product_ingredients = Table(
    "product_ingredients",
    Base.metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("ingredient_id", UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True),
)


# =========================================================
# Brand, Category, SubCategory Models
# =========================================================

class Brand(Base, TimestampMixin):
    """Tabel: brands"""
    __tablename__ = "brands"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    products: Mapped[List["Product"]] = relationship("Product", back_populates="brand")


class Category(Base, TimestampMixin):
    """Tabel: categories"""
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    sub_categories: Mapped[List["SubCategory"]] = relationship("SubCategory", back_populates="category", cascade="all, delete-orphan")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")


class SubCategory(Base, TimestampMixin):
    """Tabel: sub_categories"""
    __tablename__ = "sub_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), index=True, nullable=False)

    category: Mapped["Category"] = relationship("Category", back_populates="sub_categories")
    products: Mapped[List["Product"]] = relationship("Product", back_populates="sub_category")


# =========================================================
# Master Data: SkinType, SkinConcern, Ingredient
# =========================================================

class SkinType(Base, TimestampMixin):
    """Tabel: skin_types (All Skin Types, Normal, Dry, Oily, Sensitive, dll)"""
    __tablename__ = "skin_types"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    products: Mapped[List["Product"]] = relationship("Product", secondary=product_skin_types, back_populates="skin_types")


class SkinConcern(Base, TimestampMixin):
    """Tabel: skin_concerns (Acne, Dullness, Hydration, Dark Spots, dll)"""
    __tablename__ = "skin_concerns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    products: Mapped[List["Product"]] = relationship("Product", secondary=product_skin_concerns, back_populates="skin_concerns")


class Ingredient(Base, TimestampMixin):
    """Tabel: ingredients"""
    __tablename__ = "ingredients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    products: Mapped[List["Product"]] = relationship("Product", secondary=product_ingredients, back_populates="ingredients")


# =========================================================
# Product & Product Images Models
# =========================================================

class Product(Base, TimestampMixin):
    """
    Tabel: products
    Mencakup informasi katalog e-commerce, beauty advisor metadata,
    search_document untuk text search, dan pgvector embedding.
    """
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    item_id: Mapped[Optional[int]] = mapped_column(BigInteger, unique=True, index=True, nullable=True)
    shop_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    
    nama_produk: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    brand_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    sub_category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("sub_categories.id", ondelete="SET NULL"), nullable=True, index=True)

    harga: Mapped[float] = mapped_column(Numeric(12, 2), index=True, nullable=False)
    harga_min: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    harga_max: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    harga_asli: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    diskon_persen: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    stok: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    terjual: Mapped[int] = mapped_column(Integer, default=0, index=True, nullable=False)
    rating: Mapped[float] = mapped_column(Numeric(3, 2), default=5.0, index=True, nullable=False)

    foto_utama: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    url_produk: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Beauty advisor attributes
    is_skincare: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    usage_time: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g., "Pagi & Malam"
    texture: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)    # e.g., "Liquid / Water", "Gel"
    
    # RAG & Semantic Search
    search_document: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    embedding = mapped_column(Vector(1536), nullable=True) # pgvector 1536-dim (standard OpenAI / Qwen compatible)

    # Relasi
    brand: Mapped[Optional["Brand"]] = relationship("Brand", back_populates="products")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    sub_category: Mapped[Optional["SubCategory"]] = relationship("SubCategory", back_populates="products")
    images: Mapped[List["ProductImage"]] = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    skin_types: Mapped[List["SkinType"]] = relationship("SkinType", secondary=product_skin_types, back_populates="products")
    skin_concerns: Mapped[List["SkinConcern"]] = relationship("SkinConcern", secondary=product_skin_concerns, back_populates="products")
    ingredients: Mapped[List["Ingredient"]] = relationship("Ingredient", secondary=product_ingredients, back_populates="products")


class ProductImage(Base, TimestampMixin):
    """Tabel: product_images"""
    __tablename__ = "product_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    product: Mapped["Product"] = relationship("Product", back_populates="images")
