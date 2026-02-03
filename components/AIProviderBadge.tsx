'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface ProviderInfo {
  provider: string
  dimension: number
  isConfigured: boolean
  embeddingModel: string
  chatModel: string
}

export function AIProviderBadge() {
  const [providerInfo, setProviderInfo] = useState<ProviderInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProviderStatus()
  }, [])

  const fetchProviderStatus = async () => {
    try {
      const response = await fetch('/api/provider-status')
      const data = await response.json()
      setProviderInfo(data.current)
    } catch (error) {
      console.error('Failed to fetch provider status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
        <Loader2 className="h-3 w-3 animate-spin text-white/40" />
        <span className="text-xs text-white/40">Loading...</span>
      </div>
    )
  }

  if (!providerInfo) return null

  const providerColors = {
    openai: 'bg-green-500/10 border-green-500/20 text-green-400',
    gemini: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  }

  const color = providerColors[providerInfo.provider as keyof typeof providerColors] || 'bg-white/5 border-white/10 text-white/60'

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${color}`}>
      <Sparkles className="h-3 w-3" />
      <span className="text-xs font-medium capitalize">
        {providerInfo.provider} AI
      </span>
      <span className="text-[10px] opacity-60">
        {providerInfo.provider === 'gemini' ? '(768d→1536d)' : '(1536d)'}
      </span>
    </div>
  )
}
