# ✅ Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Database Setup ✓
- [ ] Run the SQL migration from `supabase/schema.sql` in Supabase SQL Editor
- [ ] Verify `chunks_table` was created
- [ ] Verify `match_chunks` function exists
- [ ] Check that pgvector extension is enabled

### 2. Environment Variables ✓
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Set in `.env` or `.env.local`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set in `.env` or `.env.local`
- [x] `OPENAI_API_KEY` - Set in `.env` or `.env.local`

### 3. Dependencies ✓
- [ ] Run `npm install` to install all packages
- [ ] Verify no dependency errors

## Testing Checklist

### 4. Local Testing
- [ ] Run `npm run dev`
- [ ] App loads at http://localhost:3000
- [ ] Both tabs (Chat & Training) are visible
- [ ] No console errors

### 5. Training Feature Test
- [ ] Click on Training tab
- [ ] Upload a sample PDF file
- [ ] Wait for processing completion
- [ ] Verify success message shows number of chunks
- [ ] Check Supabase table has new rows:
  ```sql
  SELECT COUNT(*) FROM chunks_table;
  ```

### 6. Chat Feature Test
- [ ] Switch to Chat tab
- [ ] Type 2-3 characters
- [ ] Wait 500ms
- [ ] Verify ghost text suggestion appears
- [ ] Press Tab to accept suggestion
- [ ] Verify suggestion fills the input
- [ ] Click Copy button
- [ ] Verify text copied to clipboard

## Production Deployment

### 7. Build Test
- [ ] Run `npm run build`
- [ ] No build errors
- [ ] All pages compile successfully

### 8. Security Considerations
- [ ] Never commit `.env.local` to Git (it's in `.gitignore`)
- [ ] Add Supabase RLS (Row Level Security) policies if needed
- [ ] Consider adding authentication for production
- [ ] Add rate limiting to API routes

### 9. Performance Optimization
- [ ] Test with large PDFs (up to 10MB)
- [ ] Monitor OpenAI API usage and costs
- [ ] Check Supabase query performance
- [ ] Consider caching frequently used suggestions

### 10. Deploy to Vercel (Recommended)
- [ ] Push code to GitHub
- [ ] Connect repository to Vercel
- [ ] Add environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENAI_API_KEY`
- [ ] Deploy
- [ ] Test production URL

## Post-Deployment

### 11. Monitor & Maintain
- [ ] Monitor OpenAI API costs
- [ ] Check Supabase usage (free tier: 500MB database, 2GB bandwidth)
- [ ] Monitor error logs in Vercel
- [ ] Collect user feedback

---

## Quick SQL Check Queries

```sql
-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'chunks_table'
);

-- Check if function exists
SELECT EXISTS (
   SELECT FROM pg_proc 
   WHERE proname = 'match_chunks'
);

-- Check number of chunks
SELECT COUNT(*) FROM chunks_table;

-- View recent chunks
SELECT id, LEFT(content, 100) as preview, created_at 
FROM chunks_table 
ORDER BY created_at DESC 
LIMIT 5;

-- Test similarity search
SELECT match_chunks(
  (SELECT embedding FROM chunks_table LIMIT 1),
  0.5,
  3
);
```

---

## Troubleshooting Commands

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check environment variables
npm run dev
# Look for "Missing environment variables" errors

# View build output
npm run build

# Test production build locally
npm run build && npm start
```

---

## Need Help?

- Check [README.md](README.md) for full documentation
- See [QUICKSTART.md](QUICKSTART.md) for setup guide
- Review [supabase/schema.sql](supabase/schema.sql) for database schema

---

**Status: Ready for Development** ✅

Your Next.js AI Autocomplete project is fully set up and ready to use!
