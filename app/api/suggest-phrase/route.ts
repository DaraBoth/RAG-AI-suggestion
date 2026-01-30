import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateEmbedding, generatePhraseSuggestion, generateSmartPhraseSuggestion } from '@/lib/openai'

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

    console.log(`[Phrase Suggestion] Query: "${text}"`)
    console.log(`[Phrase Suggestion] Generated query embedding with ${embedding.length} dimensions`)

    // Query Supabase for similar chunks using the match_chunks function
    const { data, error }:{data: any, error: any} = await supabase.rpc('match_chunks' as any, {
      query_embedding: embedding,
      match_threshold: 0.15, // Lower threshold for more context
      match_count: 10, // Increased for better pattern recognition
    } as any)

    console.log(`[Phrase Suggestion] Found ${data?.length || 0} matches from trained data`)
    if (data && data.length > 0) {
      console.log(`[Phrase Suggestion] Top match similarity: ${data[0].similarity}, content preview: ${data[0].content.substring(0, 100)}...`)
    }

    if (error) {
      console.error('Error querying chunks:', error)
      return NextResponse.json(
        { error: 'Failed to query database' },
        { status: 500 }
      )
    }

    const matches = data as any[]

    // If no matches found, use OpenAI completion as fallback
    if (!matches || matches.length === 0) {
      console.log('[Phrase Suggestion] No trained data found, using OpenAI phrase suggestion fallback')
      
      try {
        const completion = await generatePhraseSuggestion(text)
        
        return NextResponse.json({
          suggestions: [{
            text: completion,
            source: 'openai-fallback' as const,
          }],
          matches: [],
          type: 'phrase',
        })
      } catch (fallbackError) {
        console.error('Fallback phrase suggestion error:', fallbackError)
        return NextResponse.json({
          suggestions: [],
          matches: [],
          error: 'No trained data available and fallback failed',
        })
      }
    }

    // AI Agent Pattern with RAG:
    // 1. We have the user input (text)
    // 2. We retrieved relevant context from vector DB (matches)
    // 3. Use AI to generate intelligent, contextualized suggestions
    
    console.log('Using AI Agent with RAG - Retrieved chunks:', matches.length)
    
    try {
      // Pass top 5 context chunks to AI for better pattern recognition
      const contextChunks = matches.slice(0, 5).map(m => m.content)
      const aiSuggestion = await generateSmartPhraseSuggestion(text, contextChunks)

      // Also try to extract direct suggestions from top matches as alternatives
      const directSuggestions = matches
        .slice(0, 4) // Use top 4 matches for better variety
        .map(match => {
          const suggestion = generatePhraseSuggestionFromContent(text, match.content)
          return {
            text: suggestion,
            source: 'trained-data' as const,
            similarity: match.similarity,
          }
        })
        .filter(s => s.text && s.text.trim().length > 0 && s.text.length < 200) // Filter out chunks

      // Separate AI-generated from direct extractions
      const aiSuggestions = aiSuggestion && aiSuggestion.trim().length > 0 ? [{
        text: aiSuggestion,
        source: 'ai-with-context' as const,
        similarity: matches[0]?.similarity || 0,
      }] : []
      
      // Combine: direct extractions first (pure trained data), then AI
      const allSuggestions = [
        ...directSuggestions, // These are pure trained-data
        ...aiSuggestions      // This is AI-generated with context
      ].filter((s, index, self) => 
        // Remove duplicates and empty
        s.text && s.text.trim().length > 0 &&
        self.findIndex(t => t.text === s.text) === index
      ).slice(0, 5) // Limit to top 5

      return NextResponse.json({
        suggestions: allSuggestions,
        matches: matches.map(m => ({
          content: m.content.substring(0, 100) + '...',
          similarity: m.similarity,
        })),
        type: 'phrase',
      })
    } catch (aiError) {
      console.error('AI Agent suggestion error:', aiError)
      
      // Fallback to direct extraction only if AI fails
      const suggestions = matches
        .slice(0, 5)
        .map(match => {
          const suggestion = generatePhraseSuggestionFromContent(text, match.content)
          return {
            text: suggestion,
            source: 'trained-data' as const,
            similarity: match.similarity,
          }
        })
        .filter(s => s.text && s.text.trim().length > 0 && s.text.length < 200)

      return NextResponse.json({
        suggestions,
        matches: matches.map(m => ({
          content: m.content.substring(0, 100) + '...',
          similarity: m.similarity,
        })),
        type: 'phrase',
      })
    }

  } catch (error) {
    console.error('Phrase suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate phrase suggestion' },
      { status: 500 }
    )
  }
}

/**
 * Generate a phrase suggestion based on user input and matched content
 * Intelligently predicts what the user is likely to type next
 */
function generatePhraseSuggestionFromContent(userInput: string, matchedContent: string): string {
  const input = userInput.trim()
  const content = matchedContent.trim()

  // Get the last few words from user input for context matching
  const inputWords = input.split(/\s+/)
  const lastWord = inputWords[inputWords.length - 1]
  const lastTwoWords = inputWords.slice(-2).join(' ')
  const lastThreeWords = inputWords.slice(-3).join(' ')
  const lastFourWords = inputWords.slice(-4).join(' ')

  // Strategy 1: Find exact phrase matches and return what comes after
  // Try matching with last 4, 3, 2, then 1 word for best context
  for (const searchPhrase of [lastFourWords, lastThreeWords, lastTwoWords, lastWord]) {
    if (!searchPhrase || searchPhrase.length < 2) continue
    
    const searchLower = searchPhrase.toLowerCase()
    const contentLower = content.toLowerCase()
    
    // Find all occurrences of the phrase
    let index = contentLower.indexOf(searchLower)
    
    if (index !== -1) {
      // Found the phrase, extract what comes after
      const afterIndex = index + searchPhrase.length
      let continuation = content.substring(afterIndex).trim()
      
      // Remove leading punctuation but keep it if it's part of the sentence
      continuation = continuation.replace(/^[.,;:!?]\s*/, '')
      
      // Get up to 15 words or until sentence end
      const words = continuation.split(/\s+/)
      const maxWords = 15
      let result = words.slice(0, maxWords).join(' ')
      
      // If we have a natural sentence ending, cut there
      const sentenceEnd = result.match(/^[^.!?]*[.!?]/)
      if (sentenceEnd) {
        result = sentenceEnd[0]
      }
      
      if (result.length > 3) {
        return result
      }
    }
  }

  // Strategy 2: Semantic matching - if content contains similar concepts
  // Look for the input within the content and extract continuation
  const contentWords = content.toLowerCase().split(/\s+/)
  const inputWordsLower = inputWords.map(w => w.toLowerCase())
  
  // Find where the input context appears in content
  for (let i = 0; i < contentWords.length - inputWords.length; i++) {
    const matchCount = inputWordsLower.filter((word, idx) => 
      contentWords[i + idx] === word
    ).length
    
    // If we have a good match (50%+ words match)
    if (matchCount >= Math.max(2, inputWords.length * 0.5)) {
      const startIdx = content.toLowerCase().indexOf(contentWords.slice(i, i + inputWords.length).join(' '))
      if (startIdx !== -1) {
        const continuation = content.substring(startIdx + input.length).trim()
        const cleaned = continuation.replace(/^[.,;:!?]\s*/, '')
        const words = cleaned.split(/\s+/).slice(0, 15).join(' ')
        if (words.length > 3) {
          return words
        }
      }
    }
  }

  // Strategy 3: Pattern-based prediction
  // If content represents a common phrase pattern that extends user input
  if (content.length > input.length && content.toLowerCase().startsWith(input.toLowerCase())) {
    const continuation = content.substring(input.length).trim()
    const cleaned = continuation.replace(/^[.,;:!?]\s*/, '')
    const words = cleaned.split(/\s+/).slice(0, 15).join(' ')
    if (words.length > 3) {
      return words
    }
  }

  // Strategy 4: Return short relevant phrases from content
  // If content is a complete, relevant phrase that could follow the input
  if (content.length < 100 && content.length > 5) {
    // Check if it could be a natural continuation (doesn't repeat the input)
    if (!content.toLowerCase().includes(input.toLowerCase()) || 
        content.toLowerCase().indexOf(input.toLowerCase()) > 5) {
      return content
    }
  }

  // No good match found
  return ''
}
