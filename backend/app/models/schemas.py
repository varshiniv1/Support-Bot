from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class IngestMarkdownRequest(BaseModel):
    title: str
    content: str


class IngestURLRequest(BaseModel):
    url: str
    title: Optional[str] = None


class IngestResponse(BaseModel):
    document_id: str
    title: str
    chunks_created: int


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    question: str
    conversation_history: List[ChatMessage] = []


class SourceChunk(BaseModel):
    document_id: str
    content: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
    follow_up_questions: List[str]


class DocumentOut(BaseModel):
    id: str
    title: str
    source_type: str
    source_path: Optional[str]
    created_at: datetime
