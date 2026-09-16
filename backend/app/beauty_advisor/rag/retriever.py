"""
retriever.py — Semantic Retriever untuk Produk Kosmetik berbasis LangChain
Mengambil produk relevan menggunakan pgvector embedding & text search pada search_document
dan mengemas hasil sebagai LangChain Document / LangChain Retriever.
"""
import logging
from typing import List, Optional, Any
from sqlalchemy import select, or_, func, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from pydantic import Field

from app.products.models import Product
from app.beauty_advisor.rag.embedder import TextEmbedder

logger = logging.getLogger(__name__)


def product_to_langchain_document(p: Product) -> Document:
    """
    Mengonversi instance SQLAlchemy Product ke LangChain Document
    agar terintegrasi penuh dengan ekosistem LangChain.
    """
    brand_name = p.brand.name if p.brand else "-"
    cat_name = p.category.name if p.category else "-"
    st_list = [st.name for st in p.skin_types] if p.skin_types else []
    sc_list = [sc.name for sc in p.skin_concerns] if p.skin_concerns else []
    ing_list = [ing.name for ing in p.ingredients] if p.ingredients else []

    page_content = (
        f"Nama Produk: {p.nama_produk}\n"
        f"Brand: {brand_name}\n"
        f"Kategori: {cat_name}\n"
        f"Harga: Rp {float(p.harga):,.0f}\n"
        f"Rating: {float(p.rating):.1f}/5.0 (Terjual: {p.terjual})\n"
        f"Tipe Kulit: {', '.join(st_list) if st_list else 'Semua jenis kulit'}\n"
        f"Masalah Kulit: {', '.join(sc_list) if sc_list else '-'}\n"
        f"Kandungan: {', '.join(ing_list[:5]) if ing_list else '-'}\n"
        f"Tekstur: {p.texture or '-'}\n"
        f"Waktu Pakai: {p.usage_time or '-'}\n"
        f"Deskripsi: {p.search_document or '-'}"
    )

    metadata = {
        "id": str(p.id),
        "nama_produk": p.nama_produk,
        "brand": brand_name,
        "category": cat_name,
        "harga": float(p.harga),
        "rating": float(p.rating),
        "stok": p.stok,
        "terjual": p.terjual,
        "foto_utama": p.foto_utama,
        "skin_types": st_list,
        "skin_concerns": sc_list,
    }

    return Document(page_content=page_content, metadata=metadata)


class ProductRetriever:
    """
    Retriever untuk mencari kandidat produk kecantikan yang paling relevan dengan kebutuhan user.
    Mendukung pgvector cosine distance pada PostgreSQL, semantic search pada SQLite/dev,
    serta konversi output ke LangChain Document.
    """

    def __init__(self):
        self.embedder = TextEmbedder()

    async def retrieve_relevant_products(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 5,
        category_id: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> List[Product]:
        """
        Mencari kandidat produk terbaik berdasarkan kemiripan semantik dan search_document.
        """
        # 1. Coba pencarian berbasis pgvector jika kolom embedding tersedia dan terisi
        try:
            query_vector = await self.embedder.get_embedding(query)

            stmt = (
                select(Product)
                .options(
                    selectinload(Product.brand),
                    selectinload(Product.category),
                    selectinload(Product.skin_types),
                    selectinload(Product.skin_concerns),
                    selectinload(Product.ingredients),
                )
                .where(Product.stok > 0)
            )

            if max_price:
                stmt = stmt.where(Product.harga <= max_price)

            if hasattr(Product, "embedding") and Product.embedding is not None:
                stmt_vector = stmt.where(Product.embedding.isnot(None)).order_by(
                    Product.embedding.cosine_distance(query_vector)
                ).limit(limit)
                res = await db.execute(stmt_vector)
                products = res.scalars().all()
                if products:
                    return list(products)
        except Exception as e:
            logger.info(f"Pencarian pgvector dilewati (menggunakan text search fallback): {e}")

        # 2. Text Search Fallback pada search_document & nama_produk
        keywords = [k for k in query.lower().split() if len(k) > 2]
        base_stmt = (
            select(Product)
            .options(
                selectinload(Product.brand),
                selectinload(Product.category),
                selectinload(Product.skin_types),
                selectinload(Product.skin_concerns),
                selectinload(Product.ingredients),
            )
            .where(Product.stok > 0)
        )

        if max_price:
            base_stmt = base_stmt.where(Product.harga <= max_price)

        if keywords:
            conditions = []
            for kw in keywords[:5]:
                conditions.append(Product.search_document.ilike(f"%{kw}%"))
                conditions.append(Product.nama_produk.ilike(f"%{kw}%"))
            base_stmt = base_stmt.where(or_(*conditions))

        base_stmt = base_stmt.order_by(Product.terjual.desc(), Product.rating.desc()).limit(limit)
        res = await db.execute(base_stmt)
        products = res.scalars().all()

        if not products:
            fallback_stmt = (
                select(Product)
                .options(
                    selectinload(Product.brand),
                    selectinload(Product.category),
                    selectinload(Product.skin_types),
                    selectinload(Product.skin_concerns),
                    selectinload(Product.ingredients),
                )
                .where(Product.stok > 0)
            )
            if max_price:
                fallback_stmt = fallback_stmt.where(Product.harga <= max_price)
            fallback_stmt = fallback_stmt.order_by(Product.rating.desc(), Product.terjual.desc()).limit(limit)
            fallback_res = await db.execute(fallback_stmt)
            products = fallback_res.scalars().all()

        return list(products)

    async def retrieve_as_documents(
        self,
        db: AsyncSession,
        query: str,
        limit: int = 5,
        category_id: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> List[Document]:
        """
        Mengambil produk relevan dan mengembalikannya dalam bentuk list LangChain Document.
        """
        products = await self.retrieve_relevant_products(
            db=db,
            query=query,
            limit=limit,
            category_id=category_id,
            max_price=max_price,
        )
        return [product_to_langchain_document(p) for p in products]
