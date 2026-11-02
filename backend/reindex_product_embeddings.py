"""Bangun embedding katalog asli; jalankan sesudah migrasi dan perubahan katalog."""
import asyncio
import hashlib
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import app.core.all_models  # noqa: F401
from app.core.database import AsyncSessionLocal
from app.products.models import Product
from app.beauty_advisor.rag.embedder import TextEmbedder, EmbeddingUnavailableError
from app.beauty_advisor.rag.retriever import product_to_langchain_document


async def main():
    embedder = TextEmbedder()
    async with AsyncSessionLocal() as db:
        products = list((await db.execute(select(Product).options(
            selectinload(Product.brand), selectinload(Product.category), selectinload(Product.skin_types),
            selectinload(Product.skin_concerns), selectinload(Product.ingredients),
        ).order_by(Product.id))).scalars().all())
        pending = []
        for p in products:
            text = product_to_langchain_document(p).page_content
            digest = hashlib.sha256(text.encode()).hexdigest()
            if p.semantic_embedding is None or p.embedding_source != embedder.source or p.embedding_content_hash != digest:
                pending.append((p, text, digest))
        print(f"Reindex: {len(pending)} dari {len(products)} produk", flush=True)
        for offset in range(0, len(pending), 10):
            batch = pending[offset:offset + 10]
            for attempt in range(3):
                try:
                    vectors = await embedder.get_embeddings([row[1] for row in batch])
                    break
                except EmbeddingUnavailableError:
                    if attempt == 2:
                        raise
                    print(f"Batch {offset}: mencoba ulang provider ({attempt + 1}/2)", flush=True)
                    await asyncio.sleep(2 ** attempt)
            for (product, _, digest), vector in zip(batch, vectors):
                product.semantic_embedding = vector
                product.embedding_source = embedder.source
                product.embedding_content_hash = digest
            await db.commit()
            print(f"Indexed {min(offset + len(batch), len(pending))}/{len(pending)}", flush=True)
        print("Embedding katalog lengkap", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
