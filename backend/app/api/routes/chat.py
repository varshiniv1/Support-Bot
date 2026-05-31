from fastapi import APIRouter, HTTPException

from app.models.schemas import ChatRequest, ChatResponse
from app.services.hybrid_search import search
from app.services.llm import answer_with_follow_ups

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, summary="Chat with the knowledge base")
def chat(body: ChatRequest):
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    chunks = search(body.question)
    if not chunks:
        return ChatResponse(
            answer="I don't have relevant information in the knowledge base to answer that.",
            sources=[],
            follow_up_questions=[],
        )

    answer_text, follow_ups = answer_with_follow_ups(
        body.question, chunks, body.conversation_history
    )
    return ChatResponse(answer=answer_text, sources=chunks, follow_up_questions=follow_ups)
