from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    groq_api_key: str

    embedding_model: str = "all-MiniLM-L6-v2"
    groq_model: str = "llama-3.3-70b-versatile"

    chunk_size: int = 512
    chunk_overlap: int = 64
    top_k: int = 5
    vector_weight: float = 0.7
    keyword_weight: float = 0.3

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
