from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import ingest, chat, documents

app = FastAPI(
    title="Support Bot API",
    description="Multi-format knowledge base with hybrid search and auto follow-ups",
    version="1.0.0",
)

import os

_origins = os.getenv("CORS_ORIGINS", "*")
_allow_origins = [o.strip() for o in _origins.split(",")] if _origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=_origins != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/api/ingest", tags=["Ingestion"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "support-bot"}
