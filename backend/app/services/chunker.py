import re
from typing import List


def chunk_text(text: str, chunk_size: int = 512, overlap: int = 64) -> List[str]:
    """
    Split text into overlapping chunks, preferring paragraph then sentence
    boundaries so each chunk stays semantically coherent.
    """
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]

    chunks: List[str] = []
    current = ""

    for para in paragraphs:
        if len(para) > chunk_size:
            # Oversized paragraph — split at sentence boundaries
            for sentence in _split_sentences(para):
                if len(current) + len(sentence) + 1 <= chunk_size:
                    current = (current + " " + sentence).strip()
                else:
                    if current:
                        chunks.append(current)
                    tail = current[-overlap:] if current else ""
                    current = (tail + " " + sentence).strip()
        else:
            if len(current) + len(para) + 2 <= chunk_size:
                current = (current + "\n\n" + para).strip()
            else:
                if current:
                    chunks.append(current)
                tail = current[-overlap:] if current else ""
                current = (tail + "\n\n" + para).strip()

    if current:
        chunks.append(current)

    return [c for c in chunks if len(c) > 20]


def _split_sentences(text: str) -> List[str]:
    parts = re.split(r"(?<=[.!?])\s+", text)
    return [p.strip() for p in parts if p.strip()]
