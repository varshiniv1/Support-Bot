from functools import lru_cache
from typing import List

from sentence_transformers import SentenceTransformer

from app.config import get_settings


@lru_cache()
def _model() -> SentenceTransformer:
    return SentenceTransformer(get_settings().embedding_model)


def embed(texts: List[str]) -> List[List[float]]:
    """Embed a batch of texts. Returns L2-normalised vectors (cosine-ready)."""
    return _model().encode(texts, normalize_embeddings=True).tolist()


def embed_one(text: str) -> List[float]:
    return embed([text])[0]
