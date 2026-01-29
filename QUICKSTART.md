# 🚀 Quick Start Guide

Follow these steps to get your AI Autocomplete running in minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. **Create a Supabase account** at [https://supabase.com](https://supabase.com)
2. **Create a new project**
3. **Go to SQL Editor** and run:

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Create chunks_table
create table chunks_table (
  id bigserial primary key,
  content text not null,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create index for faster search
create index on chunks_table using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create match function
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
```

4. **Get your credentials** from Settings → API:
   - Project URL
   - anon/public key

## Step 3: Get OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy it (you won't see it again!)

## Step 4: Configure Environment

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
OPENAI_API_KEY=sk-your-openai-key-here
```

## Step 5: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Train Your AI

1. Go to the **Training** tab
2. Upload a PDF file
3. Wait for processing (you'll see a success message)

## Step 7: Test Suggestions

1. Go to the **Chat** tab
2. Start typing
3. After 500ms, you'll see ghost text suggestions
4. Press **Tab** to accept!

---

## Common Issues

**"Missing environment variables"**
- Make sure `.env.local` exists and has all three variables
- Restart dev server: `Ctrl+C` then `npm run dev`

**"Failed to query database"**
- Did you run the SQL commands in Supabase?
- Check the SQL Editor for any errors

**"No suggestions appearing"**
- Have you uploaded at least one PDF?
- Check browser console for errors

**"OpenAI API error"**
- Verify your API key is correct
- Check you have credits in your OpenAI account

---

Need help? Check the full [README.md](README.md) for detailed documentation.
