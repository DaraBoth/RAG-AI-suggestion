import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateEmbedding } from '@/lib/embeddings'
import { generateWordCompletion, generateSmartWordCompletion } from '@/lib/openai'

interface MatchResult {
  id: number
  content: string
  metadata: any
  similarity: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, incompleteWord } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid text provided' },
        { status: 400 }
      )
    }

    if (!incompleteWord || typeof incompleteWord !== 'string') {
      return NextResponse.json(
        { error: 'Invalid incomplete word provided' },
        { status: 400 }
      )
    }

    // Generate embedding for the full context
    const embedding = await generateEmbedding(text)

    console.log(`[Word Completion] Query: "${text}", Incomplete word: "${incompleteWord}"`)
    console.log(`[Word Completion] Generated query embedding with ${embedding.length} dimensions`)

    // Query Supabase for similar chunks using high-speed hybrid search
    const { data: qData, error } = await supabase.rpc('match_chunks_hybrid' as any, {
      query_embedding: embedding,
      literal_query: incompleteWord,
      match_threshold: 0.2,
      match_count: 5,
    } as any)

    if (error) {
      console.error('Error querying chunks:', error)
      return NextResponse.json(
        { error: 'Failed to query database' },
        { status: 500 }
      )
    }

    interface HybridMatch {
      id: number
      content: string
      metadata: Record<string, unknown>
      similarity: number
    }

    const matches = (qData as unknown as HybridMatch[]) || []

    console.log(`[Word Completion] Found ${matches.length} matches using Hybrid Search`)

    // If no matches found, use OpenAI completion as fallback
    if (matches.length === 0) {
      console.log('[Word Completion] No matches, using OpenAI fallback')

      try {
        const completion = await generateWordCompletion(text, incompleteWord)

        return NextResponse.json({
          suggestions: [{
            text: completion,
            source: 'openai-fallback',
          }],
          matches: [],
          type: 'word',
        })
      } catch (fallbackError) {
        return NextResponse.json({ suggestions: [], matches: [], error: 'Fallback failed' })
      }
    }

    interface Suggestion {
      text: string
      source: 'trained-data' | 'ai-with-context'
      similarity: number
      isLiteral?: boolean
    }

    // Hybrid Completion Logic:
    // 1. Extract direct completions from the matches
    const directCompletions: Suggestion[] = matches
      .map((match) => {
        const completion = findWordCompletion(text, incompleteWord, match.content)
        const isLiteral = match.similarity > 1.0
        return {
          text: completion,
          source: 'trained-data' as const,
          // Adjust similarity for display if it was a literal match (similarity > 1.0)
          similarity: isLiteral ? Math.min(0.99, match.similarity - 1.0) : match.similarity,
          isLiteral
        }
      })
      .filter((s) => s.text && s.text.trim().length > 0 && s.text.length < 50)

    // 2. Fast-Path: If we have multiple high-quality literal matches, we can skip AI
    const strongLiteralMatches = directCompletions.filter((s) => s.isLiteral)

    try {
      let aiSuggestions: Suggestion[] = []

      // Skip AI if we have enough confident literal matches to save time (~1.5s)
      if (strongLiteralMatches.length < 2) {
        const contextChunks = matches.slice(0, 3).map((m) => m.content)
        const aiCompletion = await generateSmartWordCompletion(text, incompleteWord, contextChunks)

        if (aiCompletion && aiCompletion.trim().length > 0) {
          aiSuggestions = [{
            text: aiCompletion,
            source: 'ai-with-context',
            // Adjust similarity for display if the top match was a literal match
            similarity: matches[0]?.similarity > 1.0 ? matches[0].similarity - 1.0 : matches[0]?.similarity || 0,
          }]
        }
      }

      // Combine suggestions: AI first (if exists), then literals, then other trained data
      const allSuggestions = [
        ...aiSuggestions,
        ...directCompletions
      ].filter((s, index, self) =>
        s.text && s.text.trim().length > 0 &&
        self.findIndex((t) => t.text === s.text) === index
      ).slice(0, 5)

      return NextResponse.json({
        suggestions: allSuggestions,
        matches: matches.slice(0, 3).map((m) => ({
          content: m.content.substring(0, 100) + '...',
          // Adjust similarity for display if it was a literal match
          similarity: m.similarity > 1.0 ? m.similarity - 1.0 : m.similarity,
        })),
        type: 'word',
      })
    } catch (aiError) {
      console.error('AI Agent word completion error:', aiError)

      // Fallback to direct matches only
      return NextResponse.json({
        suggestions: directCompletions.slice(0, 5),
        matches: matches.slice(0, 3).map((m) => ({
          content: m.content.substring(0, 100) + '...',
          similarity: m.similarity > 1.0 ? m.similarity - 1.0 : m.similarity,
        })),
        type: 'word',
      })
    }

  } catch (error) {
    console.error('Word completion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate word completion' },
      { status: 500 }
    )
  }
}

/**
 * Find a word completion from matched content
 * Returns only the completion part (not the full word)
 */
function findWordCompletion(text: string, incompleteWord: string, matchedContent: string): string {
  const words = matchedContent.split(/\s+/)

  // Find words in content that start with the incomplete word (case-insensitive for ASCII, exact for others)
  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:'"]/g, '')

    // Skip if the word is exactly the same as incomplete word (nothing to complete)
    if (cleanWord.toLowerCase() === incompleteWord.toLowerCase() ||
      cleanWord === incompleteWord) {
      continue
    }

    // For ASCII text, use case-insensitive matching
    if (/^[a-zA-Z]+$/.test(incompleteWord)) {
      if (cleanWord.toLowerCase().startsWith(incompleteWord.toLowerCase()) &&
        cleanWord.length > incompleteWord.length) {
        // Return only the completion part
        return cleanWord.substring(incompleteWord.length)
      }
    }
    // For non-ASCII (Korean, Chinese, etc.), use exact prefix matching
    else {
      if (cleanWord.startsWith(incompleteWord) && cleanWord.length > incompleteWord.length) {
        // Return only the completion part
        return cleanWord.substring(incompleteWord.length)
      }
    }
  }

  // If no exact match found in words, look for the continuation in content
  // But only if the matched content is not just the incomplete word itself
  const trimmedContent = matchedContent.trim()
  if (trimmedContent.toLowerCase() === incompleteWord.toLowerCase() ||
    trimmedContent === incompleteWord) {
    return '' // Nothing to complete
  }

  const contentLower = matchedContent.toLowerCase()
  const incompleteLower = incompleteWord.toLowerCase()
  const index = contentLower.indexOf(incompleteLower)

  if (index !== -1) {
    // Find the next word boundary
    const afterIncomplete = matchedContent.substring(index + incompleteWord.length)
    const nextWordMatch = afterIncomplete.match(/^\S+/)
    if (nextWordMatch && nextWordMatch[0].length > 0) {
      // Return just the completion part
      return nextWordMatch[0]
    }
  }

  // If no match found, return empty
  return ''
}
