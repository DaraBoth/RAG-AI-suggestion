# ✨ TypeFlow AI - Intelligent Autocomplete with RAG & Magic UI

A cutting-edge Next.js application featuring AI-powered autocomplete with Retrieval Augmented Generation (RAG), real-time training analytics, and stunning Magic UI components. Train your AI with PDF files and experience intelligent word completion and phrase suggestions powered by OpenAI embeddings and Supabase vector search.

![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Vector%20DB-green?style=flat-square&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-purple?style=flat-square&logo=openai)
![Magic UI](https://img.shields.io/badge/Magic%20UI-Components-ff69b4?style=flat-square)

## ✨ Features

### 🤖 AI-Powered Suggestions
- **Dual-Mode Autocomplete**: Smart word completion and intelligent phrase suggestions
- **RAG Architecture**: AI Agent processes vector search results for context-aware suggestions
- **Multi-Language Support**: English, Chinese, and Korean language detection and filtering
- **Real-time Suggestions**: Debounced API calls for smooth, responsive UX

### 🎨 Magic UI Components
- **ShimmerButton**: Animated gradient buttons with shimmer effects
- **NumberTicker**: Smooth counting animations for statistics
- **BorderBeam**: Animated border effects on cards
- **Sparkles**: Dynamic sparkle animations for headings

### 📊 Training & Analytics
- **PDF & Text Training**: Upload PDF files or train directly from input text
- **Real-time Statistics**: Live updates using Supabase Realtime subscriptions
- **Training Dashboard**: Track total chunks, files trained, characters processed, and last training date
- **Persistent State**: Training status preserved across tab switches with Zustand

### ⌨️ Advanced UX
- **Dropdown Suggestions**: Google-style suggestion list with similarity scores
- **Keyboard Navigation**: Arrow keys, Tab/Enter, number keys (1-5), and Escape
- **Source Badges**: Visual indicators for trained data vs AI-generated suggestions
- **Language Detection**: Automatic language detection with mismatch warnings

## 🏗️ Tech Stack

- **Framework**: Next.js 14.1.0 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + Magic UI
- **State Management**: Zustand with localStorage persistence
- **Database**: Supabase (PostgreSQL with pgvector + Realtime)
- **AI**: OpenAI API (text-embedding-3-small + GPT-3.5-turbo)
- **PDF Processing**: pdf-parse
- **Animations**: Framer Motion

## 📋 Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher)
2. **Supabase Account** (free tier works)
3. **OpenAI API Key** (with access to embeddings API)

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Set Up Supabase Database

#### Create the chunks_table

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable the pgvector extension
create extension if not exists vector;

-- Create the chunks_table
create table chunks_table (
  id bigserial primary key,
  content text not null,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create an index on the embedding column for faster similarity search
create index on chunks_table using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

#### Create the match_chunks Function

This function performs similarity search using cosine distance:

```sql
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

#### Enable Supabase Realtime

Enable realtime for the chunks_table:

```sql
-- Enable realtime for training statistics
alter publication supabase_realtime add table chunks_table;
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

**To get your Supabase credentials:**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings → API
4. Copy the Project URL and anon/public key

**To get your OpenAI API key:**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys
3. Create a new secret key

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Training the AI

#### Method 1: Upload PDF Files
1. Click on the **Train Your AI** tab
2. Drag and drop PDF files or click to browse
3. The system will:
   - Extract text from the PDF
   - Split into manageable chunks (1000 chars with 200 char overlap)
   - Generate embeddings for each chunk using OpenAI
   - Store chunks with metadata in Supabase
4. Watch the statistics update in real-time

#### Method 2: Train from Input Text
1. Type or paste text in the **Smart Suggestion** input area
2. Click the **Teach AI** button (purple gradient)
3. The text will be processed and added to your training data
4. Perfect for quick training with specific phrases

### Using Smart Suggestions

1. Start typing in the input field
2. The system will:
   - **Word Completion**: If typing mid-word, suggests completions
   - **Phrase Suggestion**: If after a space, suggests next phrases
3. View multiple suggestions in the dropdown:
   - **Similarity %**: See how relevant each suggestion is
   - **Source Badge**: Green (Trained Data) or Purple (AI Generated)
4. Accept suggestions:
   - **Arrow Keys**: Navigate through suggestions
   - **Tab/Enter**: Accept selected suggestion
   - **1-5 Keys**: Quick select by number
   - **Escape**: Close suggestions
5. Click **Copy** (teal gradient) to copy text to clipboard

### Real-time Training Analytics

The dashboard shows live statistics:
- **Total Chunks**: Number of text chunks stored
- **Files Trained**: Count of trained PDF files
- **Total Characters**: Total characters processed (animated counter)
- **Last Training**: Date and time of most recent training

Statistics update automatically via Supabase Realtime subscriptions!

## 🎨 Magic UI Components

### Shimmer Buttons
Animated gradient buttons with shimmer effects:
- **Teach AI**: Purple to blue gradient
- **Copy**: Emerald to teal gradient
- **Upload PDF**: Blue to indigo gradient

### Number Tickers
Smooth counting animations that:
- Start from 0 on page load
- Animate to actual values when data loads
- Support decimal places for characters count

### Border Beam
Animated colored beams that travel around card borders with staggered delays

### Sparkles
Dynamic sparkle effects on:
- "Smart Suggestion" heading
- "Train Your AI" heading

## 📁 Project Structure

```
typeflow-ai/
├── app/
│   ├── api/
│   │   ├── complete-word/
│   │   │   └── route.ts          # Word completion with RAG
│   │   ├── suggest-phrase/
│   │   │   └── route.ts          # Phrase suggestion with RAG
│   │   ├── train/
│   │   │   └── route.ts          # PDF/text upload & training
│   │   ├── training-stats/
│   │   │   └── route.ts          # Real-time training statistics
│   │   └── chat/
│   │       └── route.ts          # Legacy chat endpoint
│   ├── layout.tsx                # Root layout with dark theme
│   ├── page.tsx                  # Home page with tab interface
│   └── globals.css               # Global styles + Magic UI animations
├── components/
│   ├── ui/                       # shadcn/ui + Magic UI components
│   │   ├── shimmer-button.tsx
│   │   ├── number-ticker.tsx
│   │   ├── border-beam.tsx
│   │   └── sparkles.tsx
│   ├── ChatInput.tsx             # Smart suggestion input with dropdown
│   ├── TrainingTab.tsx           # Training interface with analytics
│   ├── ChatInterface.tsx         # Legacy chat interface
│   └── MainInterface.tsx         # Tab container
├── lib/
│   ├── openai.ts                 # OpenAI utilities
│   ├── supabase.ts               # Supabase client
│   ├── store.ts                  # Zustand state management
│   ├── language-detector.ts      # Language detection logic
│   └── utils.ts                  # Utility functions
├── types/
│   └── supabase.ts               # Database type definitions
├── supabase/
│   ├── schema.sql                # Database schema
│   └── migrations/               # Database migrations
├── .env.example                  # Environment variables template
├── tailwind.config.ts            # Tailwind + Magic UI animations
└── package.json
```

## 🔧 API Routes

### POST /api/complete-word

Generates word completions using RAG pattern.

**Request:**
```json
{
  "text": "What do you mea",
  "incompleteWord": "mea"
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "text": "mean",
      "source": "trained-data",
      "similarity": 0.89
    },
    {
      "text": "measure",
      "source": "ai-generated",
      "similarity": 0.76
    }
  ],
  "type": "word"
}
```

### POST /api/suggest-phrase

Generates phrase suggestions using RAG pattern.

**Request:**
```json
{
  "text": "The quick brown "
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "text": "fox jumps over the lazy dog",
      "source": "trained-data",
      "similarity": 0.91
    },
    {
      "text": "cat sleeps on the mat",
      "source": "ai-generated"
    }
  ],
  "type": "phrase"
}
```

### POST /api/train

Processes and stores PDF/text content.

**Request:**
```
Content-Type: multipart/form-data
file: [PDF or text file]
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 50 out of 50 chunks",
  "chunks": 50,
  "filename": "document.pdf"
}
```

### GET /api/training-stats

Retrieves real-time training statistics.

**Response:**
```json
{
  "totalChunks": 50,
  "totalFiles": 2,
  "totalCharacters": 500700,
  "files": ["document1.pdf", "document2.pdf"],
  "lastTrainingDate": "2026-01-29T11:08:00.000Z",
  "lastTrainingFile": "document2.pdf"
}
```

## 🚨 Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists and contains valid Supabase credentials
- Restart the development server after adding variables

### "Failed to query database" or "relation 'public.chunks' does not exist"
- The table is named `chunks_table`, not `chunks`
- Verify the `match_chunks` function exists in Supabase
- Check that the pgvector extension is enabled
- Ensure the chunks_table has the correct schema with vector(1536)

### "No text content found in PDF"
- The PDF might be scanned images without OCR
- Try a text-based PDF instead
- Check the pdf-parse library compatibility

### Suggestions not appearing
- Make sure you've uploaded at least one PDF for training
- Check that OpenAI API key is valid and has credits
- Verify the similarity threshold (0.3) isn't too high
- Check browser console for API errors

### NumberTicker not animating
- Ensure framer-motion is installed: `npm install framer-motion`
- Check that Tailwind config includes Magic UI animations
- Verify the component receives updated values

### Realtime statistics not updating
- Enable realtime on chunks_table in Supabase
- Check Supabase project has realtime enabled (free tier supported)
- Falls back to 5-second polling if realtime fails

## 🎯 Customization

### Adjust Chunk Size

Edit [app/api/train/route.ts](app/api/train/route.ts):

```typescript
const chunks = chunkText(text, 1000, 200) // size: 1000, overlap: 200
```

### Change Similarity Threshold

Edit [app/api/complete-word/route.ts](app/api/complete-word/route.ts) or [app/api/suggest-phrase/route.ts](app/api/suggest-phrase/route.ts):

```typescript
match_threshold: 0.3,  // Lower = more matches (0.0 - 1.0)
match_count: 10,       // Number of results to fetch
```

### Modify Debounce Time

Edit [components/ChatInput.tsx](components/ChatInput.tsx):

```typescript
debounceTimerRef.current = setTimeout(() => {
  fetchSuggestion(value)
}, 1000) // milliseconds - reduce for faster suggestions
```

### Customize Magic UI Animations

Edit [tailwind.config.ts](tailwind.config.ts) to adjust:
- Border beam speed: `duration` in keyframes
- Shimmer animation: `--speed` variable
- Sparkle density: `density` prop in component

### Add More Languages

Edit [lib/language-detector.ts](lib/language-detector.ts):

```typescript
export function detectLanguage(text: string): Language {
  // Add new language detection patterns
  if (/[your-pattern]/.test(text)) return 'your-lang'
  // ...
}
```

## 📊 Database Schema

### chunks_table

| Column     | Type                | Description                           |
|------------|---------------------|---------------------------------------|
| id         | bigserial (PK)      | Auto-incrementing primary key         |
| content    | text                | The actual text chunk                 |
| embedding  | vector(1536)        | OpenAI embedding (text-embedding-3-small) |
| metadata   | jsonb               | Contains: filename, chunk_index, total_chunks, characters, uploaded_at |
| created_at | timestamp           | Creation timestamp with timezone      |

### metadata Structure

```json
{
  "filename": "document.pdf",
  "chunk_index": 5,
  "total_chunks": 50,
  "characters": 1000,
  "uploaded_at": "2026-01-29T11:08:00.000Z"
}
```

## 🧠 RAG Architecture

TypeFlow AI uses a sophisticated Retrieval Augmented Generation pattern:

1. **Vector Search**: User input is embedded and searched against training data
2. **Context Retrieval**: Top 10 similar chunks are retrieved (threshold: 0.3)
3. **AI Agent Processing**: GPT-3.5-turbo processes chunks to generate intelligent suggestions
4. **Fallback Strategy**: Direct chunk extraction provides backup suggestions
5. **Deduplication**: Ensures unique suggestions with similarity scoring

This approach prevents raw chunk display (common in basic vector search) and provides contextually relevant, natural-sounding suggestions.

## 🔒 Security Notes

- API keys are stored in environment variables (never commit `.env.local`)
- Supabase Row Level Security (RLS) is not enabled - **add it for production**
- File upload size is limited by Next.js (adjust in `next.config.js` if needed)
- No authentication required - **add user auth for production use**
- OpenAI API calls are made server-side to protect API keys
- Consider rate limiting API routes for production

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
OPENAI_API_KEY=your-openai-api-key
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional language support
- More Magic UI components
- Enhanced RAG algorithms
- User authentication
- Training data management UI
- Export/import training data

## 📧 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

Built with ❤️ using Next.js, Supabase, OpenAI, and Magic UI

**TypeFlow AI** - Where Intelligence Meets Beautiful Design
