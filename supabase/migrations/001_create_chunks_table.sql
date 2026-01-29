-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create chunks_table with vector column for embeddings
CREATE TABLE IF NOT EXISTS chunks_table (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS chunks_embedding_idx 
ON chunks_table 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    chunks_table.id,
    chunks_table.content,
    chunks_table.metadata,
    1 - (chunks_table.embedding <=> query_embedding) as similarity
  FROM chunks_table
  WHERE 1 - (chunks_table.embedding <=> query_embedding) > match_threshold
  ORDER BY chunks_table.embedding <=> query_embedding
  LIMIT match_count;
$$;
