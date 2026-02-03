import { NextResponse } from 'next/server'
import { getOCRProviderInfo } from '@/lib/ocr-provider'

export async function GET() {
  try {
    const info = getOCRProviderInfo()
    
    return NextResponse.json(info)
  } catch (error) {
    console.error('[OCR Status] Error:', error)
    return NextResponse.json(
      { error: 'Failed to get OCR provider info' },
      { status: 500 }
    )
  }
}
