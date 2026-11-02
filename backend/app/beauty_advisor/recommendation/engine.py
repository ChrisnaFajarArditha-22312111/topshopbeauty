"""
engine.py — Recommendation Engine untuk AI Beauty Advisor
Menggabungkan PostgreSQL filtering + RAG Semantic Search untuk memilih kandidat produk terbaik.
"""
import logging
from typing import List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.products.models import Product
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
        # Satu jalur pencarian dengan batasan yang sama untuk semantik dan fallback.
        candidates = await self.retriever.retrieve_relevant_products(
            db, query=analysis.raw_query, limit=top_k, analysis=analysis,
        )

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
            st_list = ", ".join([st.name for st in p.skin_types]) if p.skin_types else "Tidak tersedia"
            sc_list = ", ".join([sc.name for sc in p.skin_concerns]) if p.skin_concerns else "-"
            ing_list = ", ".join([ing.name for ing in p.ingredients[:5]]) if p.ingredients else "-"

            block = (
                f"{i}. {p.nama_produk}\n"
                f"   - Brand: {brand_name}\n"
                f"   - Jenis Produk: {p.sub_category.name if p.sub_category else 'Tidak tersedia'}\n"
                f"   - Stok: {p.stok}\n"
                f"   - Harga: Rp {float(p.harga):,.0f}\n"
                f"   - Rating: {float(p.rating):.1f}/5.0 (Terjual: {p.terjual})\n"
                f"   - Tag Tipe Kulit (bukan jaminan aman): {st_list}\n"
                f"   - Membantu Masalah: {sc_list}\n"
                f"   - Kandungan Utama: {ing_list}\n"
                f"   - Tekstur/Waktu Pakai: {p.texture or '-'} / {p.usage_time or '-'}"
            )
            blocks.append(block)

        return "\n\n".join(blocks)
