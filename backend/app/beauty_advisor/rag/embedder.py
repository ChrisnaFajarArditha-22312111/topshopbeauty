"""
embedder.py — Penghasil Vector Embedding untuk RAG
Mendukung Alibaba Cloud DashScope Text Embedding dan fallback vektor deterministik untuk development/testing
"""
import hashlib
import logging
from typing import List
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

EMBEDDING_DIMENSION = 1536


class TextEmbedder:
    """
    Kelas untuk menghasilkan representasi vector embedding 1536 dimensi dari teks.
    """

    def __init__(self):
        self.api_key = settings.ALIBABA_CLOUD_API_KEY
        base_url = (getattr(settings, "ALIBABA_CLOUD_BASE_URL", "") or "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").rstrip("/")
        self.api_url = f"{base_url}/embeddings"
        self.model = "text-embedding-v3"

    async def get_embedding(self, text: str) -> List[float]:
        """Menghasilkan vector embedding (1536 float)."""
        if not self.api_key or "your_api_key" in self.api_key or self.api_key == "mock":
            return self._generate_deterministic_embedding(text)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "input": text,
            "dimensions": EMBEDDING_DIMENSION,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                r = await client.post(self.api_url, json=payload, headers=headers)
                if r.status_code == 200:
                    data = r.json()
                    emb = data.get("data", [{}])[0].get("embedding")
                    if emb and len(emb) == EMBEDDING_DIMENSION:
                        return emb
                logger.warning(f"Gagal generate embedding dari DashScope API ({r.status_code}): {r.text}. Menggunakan fallback.")
                return self._generate_deterministic_embedding(text)
            except Exception as e:
                logger.warning(f"Koneksi ke embedding API gagal: {e}. Menggunakan fallback.")
                return self._generate_deterministic_embedding(text)

    def _generate_deterministic_embedding(self, text: str) -> List[float]:
        """
        Menghasilkan vector normalisasi 1536-dimensi berbasis hash teks untuk mode dev/test.
        Menjamin kemiripan deterministik tanpa ketergantungan API pihak ketiga.
        """
        words = text.lower().split()
        vector = [0.0] * EMBEDDING_DIMENSION
        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % EMBEDDING_DIMENSION
            vector[idx] += 1.0 / (i + 1)

        # Normalisasi L2
        norm = sum(x * x for x in vector) ** 0.5
        if norm > 0:
            vector = [x / norm for x in vector]
        return vector
