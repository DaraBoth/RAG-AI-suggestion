import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('Missing OpenAI API key')
}

export const openai = new OpenAI({
  apiKey,
})

/**
 * Generate text embedding using OpenAI's text-embedding-3-small model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text, 
  })

  return response.data[0].embedding
}

/**
 * Generate a text completion using OpenAI's GPT model
 * This is used as a fallback when no trained data is available
 * @deprecated Use generateWordCompletion or generatePhraseCompletion instead
 */
export async function generateCompletion(userInput: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a professional business writing assistant. Provide autocomplete suggestions using clear, professional language appropriate for business and workplace communication. Keep suggestions concise, formal, and contextually relevant. Use proper business terminology and maintain a professional tone throughout.',
      },
      {
        role: 'user',
        content: `Complete this text in a professional business style: "${userInput}"`,
      },
    ],
    max_tokens: 100,
    temperature: 0.1,
  })

  return response.choices[0]?.message?.content?.trim() || ''
}

/**
 * Complete an incomplete word that user is typing
 * Example: "busine" -> "business"
 */
export async function generateWordCompletion(userInput: string, incompleteWord: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a word completion assistant for professional business writing. The user is typing a word but hasn\'t finished it yet. Complete ONLY the word they are typing, not the entire sentence. Return just the completed word, nothing else. Use professional business vocabulary.',
      },
      {
        role: 'user',
        content: `Context: "${userInput}"\nIncomplete word: "${incompleteWord}"\n\nComplete this word in a way that makes sense in the context. Return ONLY the completed word, nothing else.`,
      },
    ],
    max_tokens: 20,
    temperature: 0.3,
  })

  const completion = response.choices[0]?.message?.content?.trim() || ''
  // Remove quotes if AI added them
  return completion.replace(/['"]/g, '')
}

/**
 * Suggest the next phrase or sentence after a completed word
 * Example: "I would like to " -> "discuss this matter with you"
 */
export async function generatePhraseSuggestion(userInput: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a professional business writing assistant. The user has finished typing a word and wants to continue the sentence. Suggest the next natural phrase or continuation that fits the context. Keep it professional, concise (5-15 words), and contextually appropriate for business communication. Return ONLY the suggested continuation, without repeating what the user already wrote.',
      },
      {
        role: 'user',
        content: `Continue this professional text naturally: "${userInput}"`,
      },
    ],
    max_tokens: 50,
    temperature: 0.5,
  })

  return response.choices[0]?.message?.content?.trim() || ''
}

/**
 * Generate chat response using OpenAI with optional context from vector database
 */
export async function generateChatResponse(
  userMessage: string,
  context?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: context
        ? `You are a professional AI assistant with access to a knowledge base. Use the provided context to answer questions accurately and professionally. If the context doesn't contain relevant information, use your general knowledge but mention that it's not from the knowledge base.

Context from knowledge base:
${context}

Provide clear, helpful, and professional responses.`
        : 'You are a professional AI assistant. Provide clear, helpful, and professional responses to questions. Use business-appropriate language and be concise but thorough.',
    },
  ]

  // Add conversation history if provided
  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory.slice(-10)) // Keep last 10 messages for context
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: userMessage,
  })

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    max_tokens: 500,
    temperature: 0.7,
  })

  return response.choices[0]?.message?.content?.trim() || ''
}

/**
 * Generate a smart phrase suggestion using AI Agent pattern with RAG
 * This function receives user input and relevant context from vector DB,
 * then uses AI to generate an intelligent, contextualized suggestion
 */
export async function generateSmartPhraseSuggestion(
  userInput: string, 
  retrievedContext: string[]
): Promise<string> {
  const contextText = retrievedContext.length > 0 
    ? retrievedContext.map((chunk, i) => `[Context ${i + 1}]: ${chunk}`).join('\n\n')
    : 'No specific context available.'

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are an intelligent autocomplete assistant. Your job is to suggest the next phrase/words that should come after the user's input.

Rules:
1. If context is provided from the knowledge base, USE IT to generate accurate suggestions based on trained data
2. The suggestion should be a DIRECT CONTINUATION of what the user typed
3. Keep suggestions SHORT (3-10 words maximum)
4. Return ONLY the continuation text, without repeating what the user already typed
5. Match the language and tone of the user's input
6. If the context shows an exact match or similar pattern, follow it closely
7. Be concise and natural - this is autocomplete, not a full response`,
      },
      {
        role: 'user',
        content: `The user is typing: "${userInput}"

Retrieved context from knowledge base:
${contextText}

Based on the context above (if relevant), suggest what should come next after "${userInput}". Return only the continuation, not the full sentence.`,
      },
    ],
    max_tokens: 50,
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || ''
}

/**
 * Generate a smart word completion using AI Agent pattern with RAG
 */
export async function generateSmartWordCompletion(
  userInput: string,
  incompleteWord: string,
  retrievedContext: string[]
): Promise<string> {
  const contextText = retrievedContext.length > 0
    ? retrievedContext.map((chunk, i) => `[Context ${i + 1}]: ${chunk}`).join('\n\n')
    : 'No specific context available.'

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are an intelligent word completion assistant. Complete the incomplete word based on context.

Rules:
1. Return ONLY the completed word, nothing else
2. If context shows the word being used, complete it that way
3. Match the language of the incomplete word (English, Korean, etc.)
4. Keep the same capitalization style
5. Return just ONE word`,
      },
      {
        role: 'user',
        content: `Full text: "${userInput}"
Incomplete word: "${incompleteWord}"

Context from knowledge base:
${contextText}

Complete the word "${incompleteWord}". Return only the completed word.`,
      },
    ],
    max_tokens: 20,
    temperature: 0.2,
  })

  return response.choices[0]?.message?.content?.trim() || incompleteWord
}
