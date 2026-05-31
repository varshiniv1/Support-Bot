import re


def parse(content: str) -> str:
    """Strip markdown syntax and return plain text suitable for chunking."""
    # Fenced code blocks — keep content, remove fences
    text = re.sub(r"```[^\n]*\n([\s\S]*?)```", r"\1", content)
    # Inline code — remove backticks
    text = re.sub(r"`([^`\n]+)`", r"\1", text)
    # ATX headers — remove leading #
    text = re.sub(r"^#{1,6}\s+", "", text, flags=re.MULTILINE)
    # Bold / italic
    text = re.sub(r"\*{1,2}([^*\n]+)\*{1,2}", r"\1", text)
    text = re.sub(r"_{1,2}([^_\n]+)_{1,2}", r"\1", text)
    # Links — keep anchor text
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)
    # Images — remove entirely
    text = re.sub(r"!\[[^\]]*\]\([^\)]+\)", "", text)
    # Horizontal rules
    text = re.sub(r"^[-*_]{3,}\s*$", "", text, flags=re.MULTILINE)
    # Collapse excessive blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
