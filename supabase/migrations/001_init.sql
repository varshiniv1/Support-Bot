-- Enable pgvector extension
create extension if not exists vector;

-- Documents: one row per ingested source (markdown, PDF, or URL)
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  source_type text not null check (source_type in ('markdown', 'pdf', 'url')),
  source_path text,
  created_at  timestamptz not null default now()
);

-- Chunks: text segments derived from each document
create table if not exists chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  chunk_index integer not null,
  content     text not null,
  -- 384-dim vectors from all-MiniLM-L6-v2
  embedding   vector(384),
  -- generated tsvector column for BM25-style full-text search
  fts         tsvector generated always as (to_tsvector('english', content)) stored,
  created_at  timestamptz not null default now()
);

-- HNSW index for fast approximate nearest-neighbour search
create index if not exists chunks_embedding_hnsw_idx
  on chunks using hnsw (embedding vector_cosine_ops);

-- GIN index for full-text search
create index if not exists chunks_fts_gin_idx
  on chunks using gin (fts);
