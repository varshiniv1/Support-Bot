from typing import List

from app.config import get_settings
from app.db.supabase_client import get_supabase
from app.models.schemas import SourceChunk
from app.services.embedder import embed_one


def search(query: str, top_k: int | None = None) -> List[SourceChunk]:
    """
    Run hybrid search: 70% cosine-similarity vector score + 30% BM25-style
    full-text rank, fused via a Supabase RPC function.
    """
    settings = get_settings()
    k = top_k or settings.top_k
    embedding = embed_one(query)

    result = get_supabase().rpc(
        "hybrid_search",
        {
            "query_text": query,
            "query_embedding": embedding,
            "match_count": k,
            "vec_weight": settings.vector_weight,
            "kw_weight": settings.keyword_weight,
        },
    ).execute()

    return [
        SourceChunk(
            document_id=str(row["document_id"]),
            content=row["content"],
            score=float(row["score"]),
        )
        for row in (result.data or [])
    ]
