# ⚠️ IMPORTANT: Database Setup Required!

## 🎯 You Must Complete This Step Before Using the App

Your Next.js application is fully built, but the **Supabase database needs to be initialized**.

---

## 📋 Step-by-Step Database Setup

### 1. Open Supabase Dashboard

Go to: **https://app.supabase.com**

Login with your account that has the project:
- Project: `vddurwzfpcdoafgetnqo`

### 2. Navigate to SQL Editor

In your Supabase project:
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"** button

### 3. Copy the Migration Script

Open the file: **`supabase/schema.sql`** in this project

Or copy this entire SQL script:

```sql
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
create index if not exists chunks_embedding_idx 
on chunks_table 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create index on created_at for sorting
create index if not exists chunks_created_at_idx 
on chunks_table (created_at desc);

-- Create the match_chunks function for similarity search
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

### 4. Paste and Run

1. Paste the entire SQL script into the SQL Editor
2. Click the **"Run"** button (or press `Ctrl + Enter`)
3. Wait for confirmation message: "Success. No rows returned"

### 5. Verify Setup

Run this verification query in SQL Editor:

```sql
-- Check if table exists
SELECT 'chunks_table exists' as status 
WHERE EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'chunks_table'
);

-- Check if function exists  
SELECT 'match_chunks exists' as status
WHERE EXISTS (
  SELECT FROM pg_proc 
  WHERE proname = 'match_chunks'
);
```

You should see two rows confirming both exist.

---

## ✅ After Database Setup

Once the database is set up, you can:

### 1. Start Using the App

The dev server is already running at: **http://localhost:3000**

If not, run:
```bash
npm run dev
```

### 2. Train Your AI

1. Click the **"Training"** tab
2. Drag & drop a PDF file
3. Wait for processing
4. Success! Your AI is now trained

### 3. Test Suggestions

1. Click the **"Chat"** tab  
2. Start typing
3. See ghost text suggestions appear!
4. Press **Tab** to accept

---

## 🔍 How to Verify Data is Being Stored

After uploading a PDF, run this in Supabase SQL Editor:

```sql
-- Count total chunks
SELECT COUNT(*) as total_chunks FROM chunks_table;

-- View recent uploads
SELECT 
  id,
  LEFT(content, 80) as preview,
  metadata->>'filename' as filename,
  created_at
FROM chunks_table
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🐛 Common Issues

### "relation 'chunks_table' does not exist"
❌ **Problem:** Database migration not run
✅ **Solution:** Follow steps above to run the SQL script

### "function match_chunks does not exist"
❌ **Problem:** Function not created
✅ **Solution:** Make sure you ran the ENTIRE SQL script

### "extension 'vector' does not exist"
❌ **Problem:** pgvector extension not enabled
✅ **Solution:** Contact Supabase support or check project settings

---

## 📞 Need Help?

1. Check [README.md](README.md) for full documentation
2. See [QUICKSTART.md](QUICKSTART.md) for setup guide
3. Review [CHECKLIST.md](CHECKLIST.md) for testing steps

---

## 🎯 Quick Checklist

- [ ] Opened Supabase Dashboard
- [ ] Navigated to SQL Editor
- [ ] Copied migration script from `supabase/schema.sql`
- [ ] Pasted and ran the script
- [ ] Verified table and function exist
- [ ] Uploaded a test PDF in Training tab
- [ ] Tested suggestions in Chat tab

---

**Once you complete the database setup, your AI autocomplete is fully functional! 🚀**
