'use client'

import { useState, useEffect } from 'react'
import { Eye, Loader2 } from 'lucide-react'

interface OCRProviderInfo {
  current: string
  available: string[]
  details: {
    name: string
    cost: string
    location: string
    accuracy: string
  }
  isConfigured: boolean
}

export function OCRProviderBadge() {
  const [providerInfo, setProviderInfo] = useState<OCRProviderInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOCRProviderStatus()
  }, [])

  const fetchOCRProviderStatus = async () => {
    try {
      const response = await fetch('/api/ocr-status')
      const data = await response.json()
      setProviderInfo(data)
    } catch (error) {
      console.error('Failed to fetch OCR provider status:', error)
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
    tesseract: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    gemini: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    openai: 'bg-green-500/10 border-green-500/20 text-green-400'
  }

  const color = providerColors[providerInfo.current as keyof typeof providerColors] || 'bg-white/5 border-white/10 text-white/60'

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${color}`}>
      <Eye className="h-3 w-3" />
      <span className="text-xs font-medium">
        OCR: {providerInfo.details.name}
      </span>
      <span className="text-[10px] opacity-60">
        ({providerInfo.details.cost})
      </span>
    </div>
  )
}
