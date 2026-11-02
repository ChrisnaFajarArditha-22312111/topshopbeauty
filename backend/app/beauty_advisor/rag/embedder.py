"""Embedding asli DashScope dengan dimensi tetap dan kegagalan eksplisit."""
import math
import httpx
from app.core.config import settings

EMBEDDING_DIMENSION = 1024


class EmbeddingUnavailableError(RuntimeError):
    pass


class TextEmbedder:
    def __init__(self):
        self.api_key = settings.ALIBABA_CLOUD_API_KEY
        self.api_url = settings.ALIBABA_CLOUD_BASE_URL.rstrip("/") + "/embeddings"
        self.model = settings.EMBEDDING_MODEL
        self.source = f"{self.model}:{EMBEDDING_DIMENSION}"

    async def get_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Batch embedding; vektor palsu tidak dipakai sebagai pencarian semantik."""
        if not texts:
            return []
        if not self.api_key or self.api_key == "mock" or "your_api_key" in self.api_key:
            raise EmbeddingUnavailableError("Kredensial embedding belum tersedia")
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(self.api_url,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": self.model, "input": texts, "dimensions": EMBEDDING_DIMENSION})
            if response.status_code != 200:
                raise EmbeddingUnavailableError(f"Embedding provider HTTP {response.status_code}")
            data = sorted(response.json().get("data", []), key=lambda row: row["index"])
            if [row["index"] for row in data] != list(range(len(texts))):
                raise EmbeddingUnavailableError("Jumlah/index embedding tidak sesuai input")
            vectors = [row["embedding"] for row in data]
            if any(len(v) != EMBEDDING_DIMENSION or not all(math.isfinite(x) for x in v) or not any(v) for v in vectors):
                raise EmbeddingUnavailableError("Dimensi atau nilai embedding tidak valid")
            return vectors
        except (httpx.HTTPError, KeyError, ValueError, TypeError) as exc:
            raise EmbeddingUnavailableError("Embedding provider tidak tersedia") from exc

    async def get_embedding(self, text: str) -> list[float]:
        return (await self.get_embeddings([text]))[0]
