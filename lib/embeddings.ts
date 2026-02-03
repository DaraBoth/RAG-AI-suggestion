/**
 * Unified Embeddings Service
 * Supports both OpenAI and Gemini providers
 */

import { generateEmbedding as generateOpenAIEmbedding } from './openai'
import { generateGeminiEmbedding } from './gemini'
import { getAIProvider, type AIProvider } from './ai-provider'

/**
 * Generate embedding using the configured AI provider
 */
export async function generateEmbedding(
  text: string,
  provider?: AIProvider
): Promise<number[]> {
  const activeProvider = provider || getAIProvider()
  
  console.log(`[Embeddings] Using provider: ${activeProvider}`)
  
  try {
    switch (activeProvider) {
      case 'gemini':
        return await generateGeminiEmbedding(text)
      case 'openai':
      default:
        return await generateOpenAIEmbedding(text)
    }
  } catch (error) {
    console.error(`[Embeddings] Error with ${activeProvider}:`, error)
    
    // Fallback to other provider if available
    if (activeProvider === 'gemini' && process.env.OPENAI_API_KEY) {
      console.log('[Embeddings] Falling back to OpenAI')
      return await generateOpenAIEmbedding(text)
    } else if (activeProvider === 'openai' && process.env.GEMINI_API_KEY) {
      console.log('[Embeddings] Falling back to Gemini')
      return await generateGeminiEmbedding(text)
    }
    
    throw error
  }
}

/**
 * Generate multiple embeddings in batch
 */
export async function generateEmbeddings(
  texts: string[],
  provider?: AIProvider
): Promise<number[][]> {
  const embeddings: number[][] = []
  
  for (const text of texts) {
    const embedding = await generateEmbedding(text, provider)
    embeddings.push(embedding)
  }
  
  return embeddings
}
