-- Hybrid search: fuses cosine-similarity vector scores with BM25-style
-- full-text rank scores using configurable weights (default 70/30).
create or replace function hybrid_search(
  query_text      text,
  query_embedding vector(384),
  match_count     int     default 5,
  vec_weight      float   default 0.7,
  kw_weight       float   default 0.3
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  score       float
)
language sql stable
as $$
  with vector_results as (
    select
      c.id,
      c.document_id,
      c.content,
      1 - (c.embedding <=> query_embedding) as vec_score
    from chunks c
    where c.embedding is not null
    order by c.embedding <=> query_embedding
    limit match_count * 2
  ),
  keyword_results as (
    select
      c.id,
      ts_rank_cd(c.fts, plainto_tsquery('english', query_text), 32) as kw_score
    from chunks c
    where c.fts @@ plainto_tsquery('english', query_text)
    order by kw_score desc
    limit match_count * 2
  )
  select
    v.id,
    v.document_id,
    v.content,
    (v.vec_score * vec_weight + coalesce(k.kw_score, 0.0) * kw_weight) as score
  from vector_results v
  left join keyword_results k on v.id = k.id
  order by score desc
  limit match_count
$$;
