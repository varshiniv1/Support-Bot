# Support Bot

A multi-format knowledge base chatbot with hybrid semantic + keyword search and auto-suggested follow-up questions.

## Features

- **Multi-format ingestion** — index markdown, PDFs, and live URLs (scraped with trafilatura)
- **Hybrid search** — 70% semantic (pgvector cosine) + 30% keyword (Supabase full-text / BM25), catching exact product names and error codes that embeddings miss
- **Auto follow-ups** — LLM generates 2–3 clickable follow-up question chips after each answer
- **Free stack** — Groq (free LLM), Supabase free tier (vector DB + FTS), sentence-transformers (local embeddings)

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.12 |
| Embeddings | `sentence-transformers` — `all-MiniLM-L6-v2` (local, free) |
| Vector DB | Supabase + pgvector |
| Full-text search | Supabase native `tsvector` / `ts_rank` |
| LLM | Groq — `llama-3.3-70b-versatile` (free tier) |
| PDF parsing | PyMuPDF |
| URL scraping | trafilatura |
| Frontend | React 18 + Vite + Tailwind CSS |

## Prerequisites

- Python 3.12+
- Node 20+
- A free [Supabase](https://supabase.com) project
- A free [Groq](https://console.groq.com) API key

## Setup

### 1. Supabase

Run the SQL migrations in order from `supabase/migrations/` in your Supabase SQL editor:

```
001_init.sql          — tables + indexes
002_hybrid_search_rpc.sql — hybrid_search() function
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Docs at `/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

### Docker (optional)

```bash
cp backend/.env.example backend/.env  # fill in values
docker compose up --build
```

## API Reference

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/ingest/markdown` | Index markdown content |
| `POST` | `/api/ingest/pdf` | Upload and index a PDF |
| `POST` | `/api/ingest/url` | Scrape and index a URL |
| `POST` | `/api/chat` | Chat with the knowledge base |
| `GET` | `/api/documents` | List indexed documents |
| `DELETE` | `/api/documents/{id}` | Remove a document |

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes/       # FastAPI route handlers
│   │   ├── services/
│   │   │   ├── ingestion/    # markdown / PDF / URL parsers
│   │   │   ├── chunker.py    # sentence-aware text splitter
│   │   │   ├── embedder.py   # sentence-transformers wrapper
│   │   │   ├── hybrid_search.py  # vector + FTS fusion
│   │   │   └── llm.py        # Groq LLM + follow-up generation
│   │   ├── models/schemas.py
│   │   └── db/supabase_client.py
│   ├── requirements.txt
│   └── .env.example
├── supabase/migrations/
├── frontend/src/
│   └── components/           # ChatWindow, KnowledgePanel, chips
└── docker-compose.yml
```
