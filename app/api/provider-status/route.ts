import { NextRequest, NextResponse } from 'next/server'
import { getProviderInfo, getAvailableProviders } from '@/lib/ai-provider'

/**
 * GET endpoint to check AI provider status
 */
export async function GET(request: NextRequest) {
  try {
    const providerInfo = getProviderInfo()
    const availableProviders = getAvailableProviders()
    
    return NextResponse.json({
      current: providerInfo,
      available: availableProviders,
      message: providerInfo.isConfigured 
        ? `Using ${providerInfo.provider} with ${providerInfo.embeddingModel}`
        : `${providerInfo.provider} is not configured. Add ${providerInfo.provider.toUpperCase()}_API_KEY to environment variables.`
    })
  } catch (error) {
    console.error('[Provider Status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get provider status' },
      { status: 500 }
    )
  }
}
