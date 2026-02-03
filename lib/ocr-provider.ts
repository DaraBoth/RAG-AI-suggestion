/**
 * OCR Provider Configuration
 * Supports Tesseract.js (local), Gemini Vision (free cloud), and OpenAI Vision (paid cloud)
 */

export type OCRProvider = 'tesseract' | 'gemini' | 'openai'

/**
 * Get OCR provider from environment variable
 */
export function getOCRProvider(): OCRProvider {
  const provider = process.env.OCR_PROVIDER?.toLowerCase()
  
  // Check if specified provider is available
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    return 'gemini'
  }
  
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return 'openai'
  }
  
  // Default to Tesseract (local, always available)
  return 'tesseract'
}

/**
 * Check if OCR provider is configured
 */
export function isOCRProviderConfigured(provider: OCRProvider): boolean {
  switch (provider) {
    case 'gemini':
      return !!process.env.GEMINI_API_KEY
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'tesseract':
      return true // Always available (local processing)
    default:
      return false
  }
}

/**
 * Get available OCR providers
 */
export function getAvailableOCRProviders(): OCRProvider[] {
  const providers: OCRProvider[] = ['tesseract'] // Always available
  
  if (process.env.GEMINI_API_KEY) {
    providers.push('gemini')
  }
  
  if (process.env.OPENAI_API_KEY) {
    providers.push('openai')
  }
  
  return providers
}

/**
 * Get OCR provider info
 */
export function getOCRProviderInfo() {
  const provider = getOCRProvider()
  const available = getAvailableOCRProviders()
  
  const providerDetails = {
    tesseract: {
      name: 'Tesseract.js',
      cost: 'FREE',
      location: 'Local',
      accuracy: 'Good (85-95%)',
      speed: 'Medium',
      languages: '100+',
    },
    gemini: {
      name: 'Gemini Vision',
      cost: 'FREE (15 RPM)',
      location: 'Cloud',
      accuracy: 'Excellent (95-99%)',
      speed: 'Fast',
      languages: '50+',
    },
    openai: {
      name: 'OpenAI Vision',
      cost: 'Paid ($0.01/image)',
      location: 'Cloud',
      accuracy: 'Excellent (95-99%)',
      speed: 'Fast',
      languages: 'Multi-language',
    },
  }
  
  return {
    current: provider,
    available,
    details: providerDetails[provider],
    isConfigured: isOCRProviderConfigured(provider),
  }
}
