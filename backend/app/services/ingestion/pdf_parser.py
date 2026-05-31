import io

import fitz  # PyMuPDF


def parse(file_bytes: bytes) -> str:
    """Extract plain text from a PDF byte string, one page per paragraph."""
    doc = fitz.open(stream=io.BytesIO(file_bytes), filetype="pdf")
    pages: list[str] = []
    for page in doc:
        text = page.get_text("text").strip()
        if text:
            pages.append(text)
    doc.close()
    return "\n\n".join(pages)
