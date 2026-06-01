# Support Bot

> A multi-format AI knowledge base chatbot with hybrid semantic + keyword search and auto-suggested follow-up questions.

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=flat)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)

---

## Overview

Support Bot lets you build a searchable knowledge base from **markdown files, PDFs, and live URLs** and chat with it using a large language model. It combines vector similarity search with full-text keyword search for more accurate retrieval, and automatically suggests follow-up questions after every answer.

Built entirely on the free tier — no paid APIs required beyond your own keys.

---

## Features

| Feature | Details |
|---|---|
| **Multi-format ingestion** | Index markdown content, upload PDFs (PyMuPDF), or scrape any public URL (trafilatura) |
| **Hybrid search** | 70% cosine similarity (pgvector) + 30% BM25-style full-text (Supabase `tsvector`) — catches exact product names, error codes, and technical terms that pure semantic search misses |
| **Auto follow-ups** | LLM generates 2–3 clickable follow-up question chips after each answer |
| **Source citations** | Every answer shows which chunks were retrieved and their match score |
| **Conversation memory** | Last 6 turns of history are passed to the LLM for contextual answers |
| **Fully free** | Groq (free LLM), Supabase free tier, fastembed ONNX (local embeddings) |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Backend** | FastAPI + Python 3.12 | Async, fast, great OpenAPI docs out of the box |
| **Embeddings** | fastembed `all-MiniLM-L6-v2` (ONNX) | Local, free, no PyTorch dependency, 384-dim |
| **Vector DB** | Supabase + pgvector (HNSW index) | Free tier, SQL-native, no extra infra |
| **Full-text search** | Supabase `tsvector` + `ts_rank_cd` | BM25-style ranking built into Postgres |
| **LLM** | Groq `llama-3.3-70b-versatile` | Free tier, very fast inference |
| **PDF parsing** | PyMuPDF | Fast, accurate page-by-page extraction |
| **URL scraping** | trafilatura | Best-in-class main-content extraction |
| **Frontend** | React 18 + Vite + Tailwind CSS | Lightweight, fast HMR, utility-first styling |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│  KnowledgePanel          ChatWindow                      │
│  ├─ Markdown form        ├─ MessageBubble                │
│  ├─ URL input            ├─ FollowUpChips                │
│  └─ PDF upload           └─ Source citation chips        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (Vite proxy / Vercel rewrite)
┌────────────────────────▼────────────────────────────────┐
│                    Backend (FastAPI)                     │
│                                                          │
│  POST /api/ingest/markdown   POST /api/ingest/pdf        │
│  POST /api/ingest/url        GET  /api/documents         │
│  POST /api/chat                                          │
│                                                          │
│  Ingestion pipeline          Retrieval pipeline          │
│  ├─ markdown_parser          ├─ embed query (fastembed)  │
│  ├─ pdf_parser               ├─ hybrid_search() RPC      │
│  ├─ url_scraper              │   70% vector + 30% FTS    │
│  ├─ chunker                  └─ Groq LLM answer          │
│  └─ embedder (fastembed)         + follow-up generation  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Supabase (Postgres)                    │
│  documents table          chunks table                   │
│  ├─ id, title             ├─ id, document_id             │
│  ├─ source_type           ├─ content                     │
│  └─ created_at            ├─ embedding vector(384)       │
│                           └─ fts tsvector (generated)    │
│                                                          │
│  Indexes: HNSW (vector cosine) + GIN (full-text)        │
│  RPC: hybrid_search() — fuses both scores               │
└─────────────────────────────────────────────────────────┘
```

---

## Local Development

### Prerequisites
- Python 3.12+
- Node 20+
- A free [Supabase](https://supabase.com) project
- A free [Groq](https://console.groq.com) API key

### 1. Supabase setup

Run the migrations **in order** via the Supabase SQL Editor:

```
supabase/migrations/001_init.sql          — tables, pgvector, HNSW + GIN indexes
supabase/migrations/002_hybrid_search_rpc.sql  — hybrid_search() function
```

Then disable Row Level Security (required for the anon key to read/write):

```sql
alter table documents disable row level security;
alter table chunks disable row level security;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: **http://localhost:8000/docs**

> First startup downloads the `all-MiniLM-L6-v2` ONNX model (~25 MB). Subsequent starts are instant.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: **http://localhost:5173**

The Vite dev server proxies all `/api/*` requests to `localhost:8000` automatically.

### Docker (optional)

```bash
cp backend/.env.example backend/.env   # fill in values
docker compose up --build
```

---

## Deployment

The app is deployed on a fully free stack:

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | auto-deployed on push to `main` |
| Backend | Render (free tier) | https://support-bot-o83e.onrender.com |
| Database | Supabase (free tier) | managed Postgres + pgvector |

### Deploy your own

**Backend → Render**
1. Connect your GitHub repo to [render.com](https://render.com)
2. New Web Service → Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add env vars: `SUPABASE_URL`, `SUPABASE_KEY`, `GROQ_API_KEY`

**Frontend → Vercel**
1. Import repo on [vercel.com](https://vercel.com) → Root directory: `frontend`
2. Update `frontend/vercel.json` with your Render URL
3. Deploy — Vercel rewrites `/api/*` to your backend automatically

> **Note:** Render's free tier spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/ingest/markdown` | Index markdown content |
| `POST` | `/api/ingest/pdf` | Upload and index a PDF file |
| `POST` | `/api/ingest/url` | Scrape and index a public URL |
| `GET` | `/api/documents` | List all indexed documents |
| `DELETE` | `/api/documents/{id}` | Delete a document and its chunks |
| `POST` | `/api/chat` | Chat with the knowledge base |

### Chat request/response

```json
// POST /api/chat
{
  "question": "How do I reset my password?",
  "conversation_history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}

// Response
{
  "answer": "To reset your password, click Forgot Password on the login page...",
  "sources": [
    { "document_id": "uuid", "content": "...", "score": 0.87 }
  ],
  "follow_up_questions": [
    "How long is the reset link valid?",
    "What if I don't receive the email?",
    "Can I change my password from account settings?"
  ]
}
```

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/routes/          # ingest.py · chat.py · documents.py
│   │   ├── services/
│   │   │   ├── ingestion/       # markdown_parser · pdf_parser · url_scraper
│   │   │   ├── chunker.py       # paragraph-first splitter with overlap
│   │   │   ├── embedder.py      # fastembed all-MiniLM-L6-v2 wrapper
│   │   │   ├── hybrid_search.py # vector + FTS score fusion
│   │   │   └── llm.py           # Groq answer + follow-up generation
│   │   ├── models/schemas.py    # Pydantic request/response models
│   │   ├── db/supabase_client.py
│   │   ├── config.py            # pydantic-settings (.env driven)
│   │   └── main.py              # FastAPI app + CORS
│   ├── requirements.txt
│   └── .env.example
├── supabase/migrations/
│   ├── 001_init.sql             # tables + HNSW + GIN indexes
│   └── 002_hybrid_search_rpc.sql # hybrid_search() Postgres function
├── frontend/
│   └── src/
│       ├── App.jsx
│       └── components/
│           ├── ChatWindow.jsx   # messages, input, typing indicator
│           ├── MessageBubble.jsx # user/bot bubbles + source chips
│           ├── FollowUpChips.jsx # clickable follow-up pills
│           └── KnowledgePanel.jsx # sidebar with 4 ingestion tabs
├── render.yaml                  # Render deploy config
└── docker-compose.yml
```

---

## License

MIT
