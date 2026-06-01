from functools import lru_cache
from typing import List

from fastembed import TextEmbedding

_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


@lru_cache()
def _model() -> TextEmbedding:
    return TextEmbedding(model_name=_MODEL_NAME)


def embed(texts: List[str]) -> List[List[float]]:
    """Embed a batch of texts. Vectors are L2-normalised (cosine-ready)."""
    return [v.tolist() for v in _model().embed(texts)]


def embed_one(text: str) -> List[float]:
    return embed([text])[0]
