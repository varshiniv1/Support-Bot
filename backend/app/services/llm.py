from typing import List

from groq import Groq

from app.config import get_settings
from app.models.schemas import ChatMessage, SourceChunk

_SYSTEM = (
    "You are a helpful support assistant. Answer questions using only the provided context. "
    "If the context is insufficient, say so clearly. Be concise and accurate."
)


def _context_block(chunks: List[SourceChunk]) -> str:
    return "\n\n---\n\n".join(
        f"[Source {i + 1}]\n{c.content}" for i, c in enumerate(chunks)
    )


def answer(
    question: str,
    chunks: List[SourceChunk],
    history: List[ChatMessage],
) -> str:
    settings = get_settings()
    client = Groq(api_key=settings.groq_api_key)

    messages = [{"role": "system", "content": _SYSTEM}]
    for msg in history[-6:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({
        "role": "user",
        "content": f"Context:\n{_context_block(chunks)}\n\nQuestion: {question}",
    })

    resp = client.chat.completions.create(
        model=settings.groq_model,
        messages=messages,
        temperature=0.3,
        max_tokens=1024,
    )
    return resp.choices[0].message.content.strip()
