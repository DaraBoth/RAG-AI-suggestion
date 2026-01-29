import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateEmbedding, generateCompletion } from '@/lib/openai'

interface MatchResult {
  id: number
  content: string
  metadata: any
  similarity: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid text provided' },
        { status: 400 }
      )
    }

    // Don't process very short queries
    if (text.trim().length < 2) {
      return NextResponse.json({
        suggestion: '',
        matches: [],
      })
    }

    // Generate embedding for the input text
    const embedding = await generateEmbedding(text)

    // Query Supabase for similar chunks using the match_chunks function
    const { data, error } = await supabase.rpc('match_chunks' as any, {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 3,
    } as any)

    if (error) {
      console.error('Error querying chunks:', error)
      return NextResponse.json(
        { error: 'Failed to query database' },
        { status: 500 }
      )
    }

    const matches = data as MatchResult[]

    // If no matches found, use OpenAI completion as fallback
    if (!matches || matches.length === 0) {
      console.log('No trained data found, using OpenAI completion fallback')
      
      try {
        const completion = await generateCompletion(text)
        
        return NextResponse.json({
          suggestion: completion,
          matches: [],
          source: 'openai-fallback',
        })
      } catch (fallbackError) {
        console.error('Fallback completion error:', fallbackError)
        return NextResponse.json({
          suggestion: '',
          matches: [],
          error: 'No trained data available and fallback failed',
        })
      }
    }

    // Use the best match to generate a suggestion
    const bestMatch = matches[0]
    
    // Extract a relevant suggestion from the content
    // Try to find a sentence that continues from the user's input
    const suggestion = generateSuggestion(text, bestMatch.content)

    return NextResponse.json({
      suggestion,
      matches: matches.map(m => ({
        content: m.content.substring(0, 100) + '...',
        similarity: m.similarity,
      })),
      source: 'trained-data',
    })

  } catch (error) {
    console.error('Suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestion' },
      { status: 500 }
    )
  }
}

/**
 * Generate a smart suggestion based on user input and matched content
 */
function generateSuggestion(userInput: string, matchedContent: string): string {
  const input = userInput.trim().toLowerCase()
  const content = matchedContent.trim()

  // Split content into sentences
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)

  if (sentences.length === 0) return ''

  // Find sentences that could naturally continue from the input
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    const lowerSentence = trimmed.toLowerCase()

    // If the sentence starts similarly to user input, return it
    if (lowerSentence.startsWith(input)) {
      return trimmed
    }

    // If user input is short and sentence contains those words
    if (input.length < 10 && lowerSentence.includes(input)) {
      return trimmed
    }
  }

  // If no perfect match, return the first sentence as a suggestion
  const firstSentence = sentences[0].trim()
  
  // If user typed some words, try to complete naturally
  const userWords = input.split(' ')
  const lastWord = userWords[userWords.length - 1]
  
  if (lastWord && lastWord.length > 2) {
    // Find if content starts with similar context
    const words = firstSentence.toLowerCase().split(' ')
    const matchIndex = words.findIndex(w => w.startsWith(lastWord))
    
    if (matchIndex !== -1) {
      // Return from the matched word onwards
      return firstSentence.split(' ').slice(matchIndex).join(' ')
    }
  }

  return firstSentence
}
