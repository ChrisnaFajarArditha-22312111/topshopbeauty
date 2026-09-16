"""
engine.py — Recommendation Engine untuk AI Beauty Advisor
Menggabungkan PostgreSQL filtering + RAG Semantic Search untuk memilih kandidat produk terbaik.
"""
import logging
from typing import List, Tuple
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.products.models import Product, SkinType, SkinConcern
from app.beauty_advisor.recommendation.analyzer import QueryAnalysisResult
from app.beauty_advisor.rag.retriever import ProductRetriever

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Mesin rekomendasi cerdas yang memfilter dan memberi peringkat produk
    sebelum diserahkan kepada model Qwen.
    """

    def __init__(self):
        self.retriever = ProductRetriever()

    async def get_recommended_candidates(
        self,
        db: AsyncSession,
        analysis: QueryAnalysisResult,
        top_k: int = 4,
    ) -> Tuple[List[Product], str]:
        """
        Memilih kandidat produk berdasarkan analisa parameter dan semantik RAG.

        Returns:
            Tuple berisi:
            1. List[Product]: Produk kandidat terpilih
            2. str: Teks terformat untuk konteks prompt LLM
        """
        # 1. Structured Filtering via SQL
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

        # Filter harga maksimal jika pengguna menyebutkan budget
        if analysis.max_price:
            stmt = stmt.where(Product.harga <= analysis.max_price)

        # Filter tipe kulit jika terdeteksi
        if analysis.skin_type:
            stmt = stmt.join(Product.skin_types).where(
                or_(
                    SkinType.name.ilike(f"%{analysis.skin_type}%"),
                    SkinType.name.ilike("%all%"),
                    SkinType.name.ilike("%semua%"),
                )
            )

        # Filter masalah kulit jika terdeteksi
        if analysis.skin_concerns:
            concern_filters = [SkinConcern.name.ilike(f"%{c}%") for c in analysis.skin_concerns]
            stmt = stmt.join(Product.skin_concerns).where(or_(*concern_filters))

        # Filter kata kunci kategori dengan sinonim luas (misal: Cleanser -> wash, foam, sabun)
        if analysis.product_category:
            cat_synonyms = {
                "Cleanser": ["cleanser", "wash", "foam", "sabun", "micellar", "cleansing"],
                "Sunscreen": ["sunscreen", "sunblock", "tabir surya", "uv", "sun protect"],
                "Moisturizer": ["moisturizer", "pelembab", "pelembap", "gel", "cream", "lotion"],
                "Serum": ["serum", "ampoule", "essence"],
                "Toner": ["toner", "pad", "essence"],
                "Mask": ["mask", "masker", "sheet mask", "clay"],
                "Lip": ["lip", "bibir", "lipstik", "lipstick", "tint"],
                "Body Care": ["body", "badan", "lotion", "sabun mandi", "scrub", "lulur"],
            }
            keywords_to_search = cat_synonyms.get(analysis.product_category, [analysis.product_category.lower()])
            cat_filters = []
            for kw in keywords_to_search:
                cat_filters.append(Product.nama_produk.ilike(f"%{kw}%"))
                cat_filters.append(Product.search_document.ilike(f"%{kw}%"))
            stmt = stmt.where(or_(*cat_filters))

        stmt = stmt.order_by(Product.rating.desc(), Product.terjual.desc()).limit(top_k)
        res = await db.execute(stmt)
        candidates = list(res.scalars().all())

        # 2. Jika kandidat dari structured filter kurang dari top_k, lengkapi dengan RAG Semantic Search
        if len(candidates) < top_k:
            rag_products = await self.retriever.retrieve_relevant_products(
                db,
                query=analysis.raw_query,
                limit=top_k,
                max_price=analysis.max_price,
            )
            existing_ids = {p.id for p in candidates}
            for p in rag_products:
                if p.id not in existing_ids:
                    candidates.append(p)
                    existing_ids.add(p.id)
                if len(candidates) >= top_k:
                    break

        # 3. Format kandidat ke dalam teks terstruktur untuk Qwen
        formatted_context = self._format_candidates_for_prompt(candidates)
        return candidates, formatted_context

    def _format_candidates_for_prompt(self, products: List[Product]) -> str:
        """Memformat data kandidat produk agar dipahami dan dirujuk oleh LLM secara akurat."""
        if not products:
            return "(Tidak ada produk yang cocok dengan kriteria tersebut di stok toko)"

        blocks = []
        for i, p in enumerate(products, 1):
            brand_name = p.brand.name if p.brand else "-"
            st_list = ", ".join([st.name for st in p.skin_types]) if p.skin_types else "Semua jenis kulit"
            sc_list = ", ".join([sc.name for sc in p.skin_concerns]) if p.skin_concerns else "-"
            ing_list = ", ".join([ing.name for ing in p.ingredients[:5]]) if p.ingredients else "-"

            block = (
                f"{i}. {p.nama_produk}\n"
                f"   - Brand: {brand_name}\n"
                f"   - Harga: Rp {float(p.harga):,.0f}\n"
                f"   - Rating: {float(p.rating):.1f}/5.0 (Terjual: {p.terjual})\n"
                f"   - Cocok untuk Kulit: {st_list}\n"
                f"   - Membantu Masalah: {sc_list}\n"
                f"   - Kandungan Utama: {ing_list}\n"
                f"   - Tekstur/Waktu Pakai: {p.texture or '-'} / {p.usage_time or '-'}"
            )
            blocks.append(block)

        return "\n\n".join(blocks)
