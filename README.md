# 🚀 AI Autocomplete - Smart Chat Input with Vector Search

A modern Next.js application that provides AI-powered autocomplete suggestions based on your trained data. Upload PDF files to train the AI, and get intelligent suggestions as you type using OpenAI embeddings and Supabase vector search.

![Next.js](https://img.shields.io/badge/Next.js-14.1.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Vector%20DB-green?style=flat-square&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-Embeddings-purple?style=flat-square&logo=openai)

## ✨ Features

- **Ghost Text Suggestions**: See AI suggestions appear as ghost text behind your typing
- **Vector Search**: Semantic search powered by OpenAI embeddings and Supabase pgvector
- **PDF Training**: Upload PDF files to train the AI with your custom content
- **Tab to Accept**: Press Tab to instantly accept suggestions
- **Modern UI**: Beautiful dark theme with glassmorphism using Tailwind CSS and shadcn/ui
- **Real-time Processing**: 500ms debounced suggestions for smooth UX

## 🏗️ Tech Stack

- **Framework**: Next.js 14.1.0 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL with pgvector)
- **AI**: OpenAI API (text-embedding-3-small)
- **PDF Processing**: pdf-parse

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

1. Click on the **Training** tab
2. Drag and drop a PDF file or click to browse
3. The system will:
   - Extract text from the PDF
   - Split it into manageable chunks (500 chars with 50 char overlap)
   - Generate embeddings for each chunk using OpenAI
   - Store chunks and embeddings in Supabase

### Using the Chat Input

1. Switch to the **Chat** tab
2. Start typing in the input field
3. After 500ms, the AI will:
   - Generate an embedding for your input
   - Query Supabase for semantically similar chunks
   - Display a relevant suggestion as ghost text
4. Press **Tab** to accept the suggestion
5. Click **Copy** to copy the text to clipboard

## 🎨 UI Components

### Ghost Text System

The core feature uses a clever positioning trick:

```tsx
// Ghost text div sits behind the textarea
<div className="ghost-text">
  <span className="transparent">{userInput}</span>
  <span className="visible">{aiSuggestion}</span>
</div>

// Textarea sits on top
<textarea value={userInput} />
```

Key aspects:
- Both elements have identical font, padding, and dimensions
- Scroll position is synchronized in real-time
- User input is transparent, AI suggestion is visible
- Creates the illusion of ghost text behind typing

## 📁 Project Structure

```
ai-autocomplete/
├── app/
│   ├── api/
│   │   ├── suggest/
│   │   │   └── route.ts          # AI suggestion endpoint
│   │   └── train/
│   │       └── route.ts          # PDF upload & training endpoint
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── ChatInput.tsx             # Main chat input with ghost text
│   ├── TrainingTab.tsx           # PDF upload interface
│   └── MainInterface.tsx         # Tab container
├── lib/
│   ├── openai.ts                 # OpenAI embedding utilities
│   ├── supabase.ts               # Supabase client
│   └── utils.ts                  # Utility functions
├── types/
│   └── supabase.ts               # Database type definitions
├── .env.example                  # Environment variables template
└── package.json
```

## 🔧 API Routes

### POST /api/suggest

Generates AI suggestions based on user input.

**Request:**
```json
{
  "text": "How can I"
}
```

**Response:**
```json
{
  "suggestion": "How can I help you with your project today?",
  "matches": [
    {
      "content": "How can I help you with...",
      "similarity": 0.87
    }
  ]
}
```

### POST /api/train

Processes and stores PDF content.

**Request:**
```
Content-Type: multipart/form-data
file: [PDF file]
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully processed 25 out of 25 chunks",
  "chunks": 25,
  "filename": "document.pdf"
}
```

## 🚨 Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env.local` exists and contains valid Supabase credentials
- Restart the development server after adding variables

### "Failed to query database"
- Verify the `match_chunks` function exists in Supabase
- Check that the pgvector extension is enabled
- Ensure the chunks_table has the correct schema

### "No text content found in PDF"
- The PDF might be scanned images without OCR
- Try a text-based PDF instead

### Suggestions not appearing
- Make sure you've uploaded at least one PDF for training
- Check that OpenAI API key is valid and has credits
- Verify the similarity threshold (0.5) isn't too high

## 🎯 Customization

### Adjust Chunk Size

Edit [app/api/train/route.ts](app/api/train/route.ts):

```typescript
const chunks = chunkText(text, 500, 50) // size, overlap
```

### Change Similarity Threshold

Edit [app/api/suggest/route.ts](app/api/suggest/route.ts):

```typescript
match_threshold: 0.5,  // Lower = more matches
match_count: 3,        // Number of results
```

### Modify Debounce Time

Edit [components/ChatInput.tsx](components/ChatInput.tsx):

```typescript
const DEBOUNCE_TIME = 500 // milliseconds
```

## 📊 Database Schema

### chunks_table

| Column     | Type                | Description                           |
|------------|---------------------|---------------------------------------|
| id         | bigserial (PK)      | Auto-incrementing primary key         |
| content    | text                | The actual text chunk                 |
| embedding  | vector(1536)        | OpenAI embedding vector               |
| metadata   | jsonb               | Additional info (filename, index)     |
| created_at | timestamp           | Creation timestamp                    |

## 🔒 Security Notes

- API keys are stored in environment variables (never commit `.env.local`)
- Supabase Row Level Security (RLS) is not enabled - add it for production
- File upload size is limited by Next.js (adjust in `next.config.js`)
- No authentication required (add for production use)

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📧 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, Supabase, and OpenAI
