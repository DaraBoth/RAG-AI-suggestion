# 🎯 Project Overview

## What We Built

A modern **AI-powered autocomplete system** that provides intelligent suggestions as you type, powered by:

- **Vector Search**: Uses OpenAI embeddings to understand semantic meaning
- **Custom Training**: Upload your own PDF files to train the AI
- **Ghost Text UI**: Beautiful inline suggestions that appear behind your typing
- **Tab to Accept**: Quick keyboard shortcut to accept suggestions

---

## 🏗️ Architecture

### Frontend (Next.js + React)
```
User Types → Debounce (500ms) → API Request → Display Ghost Text
```

### Backend Flow
```
Text Input → OpenAI Embeddings → Vector Search → Return Similar Content
```

### Training Flow
```
PDF Upload → Extract Text → Chunk Text → Generate Embeddings → Store in DB
```

---

## 📁 File Structure Explained

### `/app`
- **`page.tsx`** - Home page, renders MainInterface
- **`layout.tsx`** - Root layout with dark theme and Inter font
- **`globals.css`** - Tailwind CSS styles

### `/app/api`
- **`/suggest/route.ts`** - AI suggestion endpoint
  - Takes user input text
  - Generates embedding
  - Queries Supabase for similar chunks
  - Returns intelligent suggestion
  
- **`/train/route.ts`** - PDF training endpoint
  - Accepts PDF file upload
  - Extracts text using pdf-parse
  - Chunks text (500 chars, 50 overlap)
  - Generates embeddings for each chunk
  - Stores in Supabase

### `/components`
- **`MainInterface.tsx`** - Tab container (Chat/Training)
- **`ChatInput.tsx`** - Main chat input with ghost text feature
- **`TrainingTab.tsx`** - PDF upload interface
- **`/ui/`** - shadcn/ui components (button, card, tabs, etc.)

### `/lib`
- **`supabase.ts`** - Supabase client initialization
- **`openai.ts`** - OpenAI client and embedding generation
- **`utils.ts`** - Utility functions (cn for className merging)

### `/types`
- **`supabase.ts`** - Database type definitions for TypeScript

### `/supabase`
- **`schema.sql`** - Database migration script

---

## 🔑 Key Features Explained

### 1. Ghost Text System

The ghost text effect uses a clever CSS positioning trick:

```tsx
<div className="relative">
  {/* Ghost text layer (behind) */}
  <div className="absolute">
    <span className="transparent">{userInput}</span>
    <span className="visible">{aiSuggestion}</span>
  </div>
  
  {/* Real textarea (on top) */}
  <textarea value={userInput} />
</div>
```

**How it works:**
- Two elements with identical dimensions and styling
- Ghost text div positioned absolutely behind textarea
- User's input rendered transparent
- AI suggestion rendered in light gray
- Scroll positions synchronized
- Creates illusion of ghost text

### 2. Vector Similarity Search

**What are embeddings?**
- Embeddings convert text into arrays of numbers (vectors)
- Similar text has similar vectors
- We can measure "similarity" using cosine distance

**Our implementation:**
1. User types: "How can I"
2. Convert to embedding: `[0.12, -0.45, 0.67, ...]` (1536 dimensions)
3. Compare with stored embeddings in database
4. Return most similar chunks
5. Extract relevant suggestion from best match

**The SQL function:**
```sql
-- <=> is the cosine distance operator
-- 1 - distance gives us similarity (0 to 1)
-- Lower distance = more similar
ORDER BY embedding <=> query_embedding
```

### 3. Text Chunking Strategy

**Why chunk?**
- PDFs can be very long
- Better to search small, focused pieces
- Each chunk has its own embedding

**Our approach:**
- Split by sentences
- Combine until ~500 characters
- Overlap 50 characters between chunks
- Maintains context at boundaries

**Example:**
```
Chunk 1: "AI is powerful. It can help..."
Chunk 2: "...can help with tasks. Machine learning..."
          ^^^ 50 char overlap ^^^
```

### 4. Debouncing

**Problem:** Don't want to call API on every keystroke
**Solution:** Wait 500ms after user stops typing

```typescript
let timer;
textarea.onChange(() => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    fetchSuggestion(); // Only after 500ms of no typing
  }, 500);
});
```

---

## 🎨 UI/UX Design Choices

### Dark Theme with Glassmorphism
- Background: Purple gradient
- Cards: Semi-transparent with backdrop blur
- Creates modern, premium feel

### Color Palette
- Background: `#0f0c29` → `#302b63` → `#24243e`
- Primary: Blue/Purple (`#667eea`, `#764ba2`)
- Ghost text: White at 35% opacity
- Borders: White at 10-20% opacity

### Typography
- Font: Inter (clean, modern sans-serif)
- Input: Monospace for code-like feel
- Sizes: 16px input, 14px descriptions

---

## 🔧 Customization Guide

### Adjust Similarity Threshold

Lower = more matches (less strict)
Higher = fewer matches (more strict)

```typescript
// app/api/suggest/route.ts
match_threshold: 0.5,  // Try 0.3 for more matches
```

### Change Chunk Size

Larger = more context, fewer chunks
Smaller = more precise, more chunks

```typescript
// app/api/train/route.ts
chunkText(text, 500, 50)  // (size, overlap)
```

### Modify Debounce Time

Shorter = faster suggestions, more API calls
Longer = slower suggestions, fewer API calls

```typescript
// components/ChatInput.tsx
const DEBOUNCE_TIME = 500 // milliseconds
```

### Customize Suggestion Logic

```typescript
// app/api/suggest/route.ts
function generateSuggestion(userInput, matchedContent) {
  // Your custom logic here
  // Could use GPT to generate instead of extracting
}
```

---

## 📊 Cost Estimates

### OpenAI Costs (text-embedding-3-small)
- **$0.00002 per 1,000 tokens** (~750 words)
- Example: 100-page PDF = ~75,000 words = 100,000 tokens = **$0.002**
- 1,000 suggestions per day = ~10,000 tokens = **$0.0002/day**
- **Very cheap!**

### Supabase Free Tier
- 500 MB database
- 2 GB bandwidth
- Unlimited API requests
- **Should be enough for development**

---

## 🚀 Next Steps / Ideas for Enhancement

1. **Add GPT-4 Integration**
   - Use GPT to generate better suggestions
   - Instead of extracting from chunks, ask GPT to complete

2. **Multi-file Training**
   - Train from multiple PDFs
   - Show which document suggestion came from

3. **Authentication**
   - User accounts with Supabase Auth
   - Personal training data per user

4. **Suggestion History**
   - Store accepted suggestions
   - Show most used suggestions

5. **Advanced Chunking**
   - Use semantic chunking (split by topics)
   - LangChain integration

6. **Real-time Collaboration**
   - Multiple users training together
   - Shared knowledge base

7. **Analytics Dashboard**
   - Track suggestion acceptance rate
   - Most searched queries
   - Training data coverage

---

## 🐛 Common Issues & Solutions

### "No suggestions appearing"
- Upload a PDF first in Training tab
- Check that match_threshold isn't too high
- Verify OpenAI API key is valid

### "Suggestions are not relevant"
- Lower the match_threshold (try 0.3)
- Increase match_count (try 5)
- Upload more training data

### "Ghost text is misaligned"
- Check that textarea and ghost-text have identical styling
- Verify scroll sync is working
- Check for CSS conflicts

### "Database errors"
- Verify schema.sql was run in Supabase
- Check that pgvector extension is enabled
- Confirm function match_chunks exists

---

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Vector Guide](https://supabase.com/docs/guides/ai)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [pgvector GitHub](https://github.com/pgvector/pgvector)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**Happy coding! 🎉**
