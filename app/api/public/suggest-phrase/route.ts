import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey } from '@/lib/auth-middleware'
import { generateEmbedding } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

/**
 * POST /api/public/suggest-phrase
 * Public API endpoint for phrase suggestions with API key authentication
 * 
 * Headers:
 * - Authorization: Bearer YOUR_API_KEY (required)
 * 
 * Body:
 * - text: string (required) - The current text input
 * - limit: number (optional) - Number of suggestions (default: 5, max: 10)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // Authenticate the request
  const auth = await authenticateApiKey(request, 'suggest-phrase')
  
  if (!auth.authenticated) {
    return auth.response!
  }

  try {
    const body = await request.json()
    const { text, limit = 5 } = body

    // Validate input
    if (!text) {
      return NextResponse.json(
        { 
          error: 'Bad Request',
          message: '"text" is required',
          example: {
            text: "I love to eat "
          }
        },
        { status: 400 }
      )
    }

    const maxLimit = Math.min(limit, 10)

    // Generate embedding for the context
    const embedding = await generateEmbedding(text)

    // Search for relevant chunks
    const { data, error }:{data: any, error: any} = await supabase.rpc('match_chunks', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 10,
    } as any)

    if (error) {
      console.error('Error matching chunks:', error)
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: 'Failed to retrieve suggestions'
        },
        { status: 500 }
      )
    }

    // Extract phrase suggestions
    const suggestions = new Set<string>()
    const lastWords = text.trim().split(/\s+/).slice(-3).join(' ').toLowerCase()

    for (const chunk of data || []) {
      const content = chunk.content
      const sentences = content.split(/[.!?]+/)

      for (const sentence of sentences) {
        const trimmed = sentence.trim()
        const lowerSentence = trimmed.toLowerCase()

        if (lowerSentence.includes(lastWords)) {
          const index = lowerSentence.indexOf(lastWords)
          const afterContext = trimmed.substring(index + lastWords.length).trim()

          if (afterContext) {
            const words = afterContext.split(/\s+/)
            if (words.length >= 2) {
              const phrase = words.slice(0, Math.min(words.length, 5)).join(' ')
              if (phrase.length > 3 && phrase.length < 100) {
                suggestions.add(phrase)
              }
            }
          }
        }
      }

      if (suggestions.size >= maxLimit) break
    }

    const result = Array.from(suggestions)
      .slice(0, maxLimit)
      .map(text => ({ text, type: 'phrase' as const }))

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        suggestions: result,
        count: result.length,
        metadata: {
          responseTime: `${responseTime}ms`,
          apiVersion: '1.0'
        }
      },
      {
        headers: {
          'X-Response-Time': `${responseTime}ms`,
          'X-API-Version': '1.0'
        }
      }
    )

  } catch (error) {
    console.error('Error in public suggest-phrase endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}
