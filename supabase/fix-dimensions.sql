-- Fix: Update vector dimensions from 768 to 1536
-- This script drops and recreates the table with correct dimensions

-- WARNING: This will delete all existing training data!
-- If you have important data, back it up first.

-- Drop the existing function first (it depends on the table)
DROP FUNCTION IF EXISTS match_chunks(vector, float, int);

-- Drop the existing table
DROP TABLE IF EXISTS chunks_table CASCADE;

-- Recreate the table with correct 1536 dimensions
CREATE TABLE chunks_table (
  id bigserial primary key,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Recreate indexes
CREATE INDEX chunks_embedding_idx 
ON chunks_table 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX chunks_created_at_idx 
ON chunks_table (created_at desc);

-- Recreate the match_chunks function
CREATE OR REPLACE FUNCTION match_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
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

-- Verify the fix
SELECT 
  column_name, 
  data_type,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'chunks_table';
