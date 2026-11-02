"""
retriever.py — Semantic Retriever untuk Produk Kosmetik berbasis LangChain
Mengambil produk relevan menggunakan pgvector embedding & text search pada search_document
dan mengemas hasil sebagai LangChain Document / LangChain Retriever.
"""
import logging
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from langchain_core.documents import Document

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
        f"Tipe Kulit: {', '.join(st_list) if st_list else 'Tidak tersedia'}\n"
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
    """Rangking semantik hanya di dalam batasan katalog yang telah tervalidasi."""
    def __init__(self):
        self.embedder = TextEmbedder()

    async def retrieve_relevant_products(
        self, db: AsyncSession, query: str, limit: int = 5,
        category_id: Optional[str] = None, max_price: Optional[float] = None,
        analysis=None,
    ) -> List[Product]:
        from app.beauty_advisor.recommendation.analyzer import analyze_user_query
        from app.beauty_advisor.recommendation.filters import eligible_products
        analysis = analysis or analyze_user_query(query)
        if max_price is not None:
            analysis = analysis.model_copy(update={"max_price": max_price})
        base = eligible_products(analysis, category_id=category_id)
        source = self.embedder.source
        # Savepoint menjaga transaksi tetap bisa dipakai jika pgvector gagal.
        try:
            async with db.begin_nested():
                vector = await self.embedder.get_embedding(query)
                stmt = base.where(Product.semantic_embedding.isnot(None), Product.embedding_source == source).order_by(
                    Product.semantic_embedding.cosine_distance(vector), Product.rating.desc(), Product.id
                ).limit(limit)
                products = list((await db.execute(stmt)).scalars().all())
            if len(products) == limit:
                return products
        except Exception as exc:
            logger.warning("Pencarian semantik tidak tersedia (%s); menggunakan filter katalog yang sama", type(exc).__name__)
            products = []
        # Pengisian hasil tetap mempertahankan semua batasan, tanpa produk acak di luar kategori.
        stmt = base.order_by(Product.rating.desc(), Product.terjual.desc(), Product.id).limit(limit)
        structured = (await db.execute(stmt)).scalars().all()
        seen = {p.id for p in products}
        for product in structured:
            if product.id not in seen:
                products.append(product)
                seen.add(product.id)
            if len(products) >= limit:
                break
        return products

    async def retrieve_as_documents(
        self, db: AsyncSession, query: str, limit: int = 5,
        category_id: Optional[str] = None, max_price: Optional[float] = None,
    ) -> List[Document]:
        products = await self.retrieve_relevant_products(db, query, limit, category_id, max_price)
        return [product_to_langchain_document(p) for p in products]
