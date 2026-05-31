import json
from typing import List, Tuple

from groq import Groq

from app.config import get_settings
from app.models.schemas import ChatMessage, SourceChunk

_SYSTEM = (
    "You are a helpful support assistant. Answer questions using only the provided context. "
    "If the context is insufficient, say so clearly. Be concise and accurate."
)

_FOLLOW_UP_PROMPT = (
    "Based on the question and answer above, suggest 2-3 short follow-up questions the user "
    "might ask next. Return ONLY a JSON array of strings — no other text.\n"
    'Example: ["How do I reset my password?", "What plans are available?"]'
)


def _context_block(chunks: List[SourceChunk]) -> str:
    return "\n\n---\n\n".join(
        f"[Source {i + 1}]\n{c.content}" for i, c in enumerate(chunks)
    )


def answer_with_follow_ups(
    question: str,
    chunks: List[SourceChunk],
    history: List[ChatMessage],
) -> Tuple[str, List[str]]:
    """
    Answer the question from context, then generate follow-up question chips
    in a second Groq call. Returns (answer_text, follow_up_questions).
    """
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
    answer_text = resp.choices[0].message.content.strip()

    follow_ups = _generate_follow_ups(client, settings.groq_model, question, answer_text)
    return answer_text, follow_ups


def _generate_follow_ups(client: Groq, model: str, question: str, answer: str) -> List[str]:
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[{
                "role": "user",
                "content": (
                    f"Question: {question}\n"
                    f"Answer: {answer[:600]}\n\n"
                    f"{_FOLLOW_UP_PROMPT}"
                ),
            }],
            temperature=0.7,
            max_tokens=200,
        )
        raw = resp.choices[0].message.content.strip()
        start, end = raw.find("["), raw.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(raw[start:end])
    except Exception:
        pass
    return []
