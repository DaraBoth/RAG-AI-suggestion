/**
 * AI Provider Configuration
 * Allows switching between OpenAI and Gemini
 */

export type AIProvider = 'openai' | 'gemini'

// Get AI provider from environment variable
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase()
  
  if (provider === 'gemini') {
    return 'gemini'
  }
  
  // Default to OpenAI
  return 'openai'
}

/**
 * Get embedding dimension based on provider
 */
export function getEmbeddingDimension(provider?: AIProvider): number {
  const activeProvider = provider || getAIProvider()
  
  switch (activeProvider) {
    case 'gemini':
      return 768 // Gemini text-embedding-004
    case 'openai':
    default:
      return 1536 // OpenAI text-embedding-3-small
  }
}

/**
 * Check if provider is configured
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  switch (provider) {
    case 'gemini':
      return !!process.env.GEMINI_API_KEY
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    default:
      return false
  }
}

/**
 * Get available providers
 */
export function getAvailableProviders(): AIProvider[] {
  const providers: AIProvider[] = []
  
  if (isProviderConfigured('openai')) {
    providers.push('openai')
  }
  
  if (isProviderConfigured('gemini')) {
    providers.push('gemini')
  }
  
  return providers
}

/**
 * Get active provider info
 */
export function getProviderInfo() {
  const provider = getAIProvider()
  const dimension = getEmbeddingDimension(provider)
  const isConfigured = isProviderConfigured(provider)
  
  return {
    provider,
    dimension,
    isConfigured,
    embeddingModel: provider === 'gemini' ? 'text-embedding-004' : 'text-embedding-3-small',
    chatModel: provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-3.5-turbo'
  }
}
