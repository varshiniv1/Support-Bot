from typing import List

from fastapi import APIRouter, HTTPException

from app.db.supabase_client import get_supabase
from app.models.schemas import DocumentOut

router = APIRouter()


@router.get("", response_model=List[DocumentOut], summary="List all indexed documents")
def list_documents():
    db = get_supabase()
    result = db.table("documents").select("*").order("created_at", desc=True).execute()
    return result.data or []


@router.delete("/{document_id}", summary="Delete a document and all its chunks")
def delete_document(document_id: str):
    db = get_supabase()
    result = db.table("documents").delete().eq("id", document_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"deleted": document_id}
