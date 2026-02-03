import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY
let genAI: GoogleGenerativeAI | null = null

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey)
}

/**
 * Generate embeddings using Gemini's text-embedding-004 model
 * Dimension: 768 (padded to 1536 for database compatibility)
 * Free tier: 15 RPM, 1M tokens/day
 */
export async function generateGeminiEmbedding(text: string): Promise<number[]> {
  if (!genAI) {
    throw new Error('Gemini API key not configured')
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const result = await model.embedContent(text)
    const embedding = result.embedding
    
    // Gemini returns 768 dimensions, pad to 1536 for database compatibility
    const paddedEmbedding = [
      ...embedding.values,
      ...Array(768).fill(0) // Pad with zeros to reach 1536 dimensions
    ]
    
    return paddedEmbedding
  } catch (error) {
    console.error('[Gemini] Error generating embedding:', error)
    throw new Error('Failed to generate Gemini embedding')
  }
}

/**
 * Generate chat completion using Gemini
 * Models available:
 * - gemini-1.5-flash: Fast, free tier (15 RPM)
 * - gemini-1.5-pro: Better quality, paid
 */
export async function generateGeminiChatCompletion(
  messages: { role: string; content: string }[],
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro' = 'gemini-1.5-flash'
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API key not configured')
  }

  try {
    const geminiModel = genAI.getGenerativeModel({ model })
    
    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))
    
    const lastMessage = messages[messages.length - 1].content
    
    const chat = geminiModel.startChat({ history })
    const result = await chat.sendMessage(lastMessage)
    const response = result.response
    
    return response.text()
  } catch (error) {
    console.error('[Gemini] Error generating chat completion:', error)
    throw new Error('Failed to generate Gemini chat completion')
  }
}

/**
 * Generate text completion/suggestion using Gemini
 */
export async function generateGeminiCompletion(
  prompt: string,
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro' = 'gemini-1.5-flash'
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API key not configured')
  }

  try {
    const geminiModel = genAI.getGenerativeModel({ model })
    const result = await geminiModel.generateContent(prompt)
    const response = result.response
    
    return response.text()
  } catch (error) {
    console.error('[Gemini] Error generating completion:', error)
    throw new Error('Failed to generate Gemini completion')
  }
}

/**
 * Check if Gemini is configured
 */
export function isGeminiConfigured(): boolean {
  return !!apiKey && !!genAI
}

/**
 * Get Gemini embedding dimension
 */
export function getGeminiEmbeddingDimension(): number {
  return 768
}
