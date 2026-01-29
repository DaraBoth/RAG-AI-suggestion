-- Enable pgvector extension for vector similarity search
create extension if not exists vector;

-- Create the main chunks table for storing PDF content and embeddings
create table if not exists chunks_table (
  id bigserial primary key,
  content text not null,
  embedding vector(1536) not null,
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index on embedding column for faster similarity search using IVFFlat
-- IVFFlat is an approximate nearest neighbor algorithm optimized for cosine distance
create index if not exists chunks_embedding_idx 
on chunks_table 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create index on created_at for sorting
create index if not exists chunks_created_at_idx 
on chunks_table (created_at desc);

-- Create the match_chunks function for similarity search
-- This function takes a query embedding and returns similar chunks
create or replace function match_chunks (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    chunks_table.id,
    chunks_table.content,
    chunks_table.metadata,
    1 - (chunks_table.embedding <=> query_embedding) as similarity
  from chunks_table
  where 1 - (chunks_table.embedding <=> query_embedding) > match_threshold
  order by chunks_table.embedding <=> query_embedding
  limit match_count;
$$;

-- Add a comment to the table
comment on table chunks_table is 'Stores text chunks and their embeddings from uploaded PDF files';

-- Add comments to columns
comment on column chunks_table.id is 'Unique identifier for each chunk';
comment on column chunks_table.content is 'The actual text content of the chunk';
comment on column chunks_table.embedding is 'OpenAI text-embedding-3-small vector (1536 dimensions)';
comment on column chunks_table.metadata is 'Additional metadata like filename, chunk index, etc.';
comment on column chunks_table.created_at is 'Timestamp when the chunk was created';
