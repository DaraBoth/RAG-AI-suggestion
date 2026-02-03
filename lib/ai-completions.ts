/**
 * Unified AI Completions Service
 * Supports both OpenAI and Gemini providers
 */

import { openai } from './openai'
import { generateGeminiChatCompletion, generateGeminiCompletion } from './gemini'
import { getAIProvider, type AIProvider } from './ai-provider'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * Generate chat completion using configured provider
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  provider?: AIProvider
): Promise<string> {
  const activeProvider = provider || getAIProvider()
  
  console.log(`[Chat] Using provider: ${activeProvider}`)
  
  try {
    switch (activeProvider) {
      case 'gemini': {
        // Gemini doesn't support system messages in the same way
        // Prepend system message to first user message if exists
        const processedMessages = messages.map((msg, idx) => {
          if (msg.role === 'system') {
            return { role: 'user', content: msg.content }
          }
          return { role: msg.role, content: msg.content }
        })
        
        return await generateGeminiChatCompletion(processedMessages)
      }
      
      case 'openai':
      default: {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7,
          max_tokens: 500
        })
        
        return completion.choices[0].message.content || ''
      }
    }
  } catch (error) {
    console.error(`[Chat] Error with ${activeProvider}:`, error)
    
    // Fallback logic
    if (activeProvider === 'gemini' && process.env.OPENAI_API_KEY) {
      console.log('[Chat] Falling back to OpenAI')
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 500
      })
      return completion.choices[0].message.content || ''
    }
    
    throw error
  }
}

/**
 * Generate simple text completion
 */
export async function generateTextCompletion(
  prompt: string,
  provider?: AIProvider
): Promise<string> {
  const activeProvider = provider || getAIProvider()
  
  console.log(`[Completion] Using provider: ${activeProvider}`)
  
  try {
    switch (activeProvider) {
      case 'gemini':
        return await generateGeminiCompletion(prompt)
      
      case 'openai':
      default: {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 150
        })
        
        return completion.choices[0].message.content || ''
      }
    }
  } catch (error) {
    console.error(`[Completion] Error with ${activeProvider}:`, error)
    throw error
  }
}

/**
 * Generate word completion suggestion
 */
export async function generateWordCompletion(
  context: string,
  incompleteWord: string,
  provider?: AIProvider
): Promise<string[]> {
  const prompt = `Given the context: "${context}"
Complete the word starting with "${incompleteWord}".
Return only 3 most likely word completions, one per line, without explanations.`

  const completion = await generateTextCompletion(prompt, provider)
  
  return completion
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 3)
}

/**
 * Generate phrase suggestion
 */
export async function generatePhraseSuggestion(
  context: string,
  provider?: AIProvider
): Promise<string[]> {
  const prompt = `Given this text: "${context}"
Suggest 3 natural next phrases or sentences that would logically follow.
Return only the suggestions, one per line, without explanations.`

  const completion = await generateTextCompletion(prompt, provider)
  
  return completion
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .slice(0, 3)
}
