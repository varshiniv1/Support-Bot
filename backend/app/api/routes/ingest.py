from fastapi import APIRouter, File, HTTPException, UploadFile

from app.config import get_settings
from app.db.supabase_client import get_supabase
from app.models.schemas import IngestMarkdownRequest, IngestResponse, IngestURLRequest
from app.services import chunker, embedder
from app.services.ingestion import markdown_parser, pdf_parser, url_scraper

router = APIRouter()


def _index(title: str, source_type: str, text: str, source_path: str | None = None) -> IngestResponse:
    """Chunk, embed, and store a document. Returns an IngestResponse."""
    settings = get_settings()
    db = get_supabase()

    doc = db.table("documents").insert({
        "title": title,
        "source_type": source_type,
        "source_path": source_path,
    }).execute()

    if not doc.data:
        raise HTTPException(status_code=500, detail="Failed to create document record")

    document_id = doc.data[0]["id"]

    chunks = chunker.chunk_text(text, settings.chunk_size, settings.chunk_overlap)
    if not chunks:
        raise HTTPException(status_code=422, detail="No text content could be extracted")

    embeddings = embedder.embed(chunks)

    db.table("chunks").insert([
        {
            "document_id": document_id,
            "chunk_index": i,
            "content": chunk,
            "embedding": embedding,
        }
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]).execute()

    return IngestResponse(document_id=document_id, title=title, chunks_created=len(chunks))


@router.post("/markdown", response_model=IngestResponse, summary="Index markdown content")
def ingest_markdown(body: IngestMarkdownRequest):
    text = markdown_parser.parse(body.content)
    return _index(body.title, "markdown", text)


@router.post("/pdf", response_model=IngestResponse, summary="Upload and index a PDF")
async def ingest_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    raw = await file.read()
    try:
        text = pdf_parser.parse(raw)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"PDF parse error: {exc}")
    title = file.filename.removesuffix(".pdf").replace("_", " ").replace("-", " ").title()
    return _index(title, "pdf", text, source_path=file.filename)


@router.post("/url", response_model=IngestResponse, summary="Scrape and index a URL")
def ingest_url(body: IngestURLRequest):
    try:
        scraped_title, text = url_scraper.scrape(body.url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    title = body.title or scraped_title
    return _index(title, "url", text, source_path=body.url)
