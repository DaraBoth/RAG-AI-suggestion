import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET endpoint to retrieve list of all trained files
 */
export async function GET() {
  try {
    console.log('[Trained Files] Fetching list of trained files')

    // Use RPC function for server-side aggregation (bypasses 1000 row limit)
    const { data: filesData, error } = await supabase
      .rpc('get_trained_files_stats')

    if (error) {
      console.error('[Trained Files] Error fetching files:', error)
      return NextResponse.json(
        { error: 'Failed to fetch training files: ' + error.message },
        { status: 500 }
      )
    }

    interface TrainedFileStat {
      filename: string
      chunk_count: number
      last_updated: string
    }

    interface TrainedFileResult {
      filename: string
      chunkCount: number
      lastUpdated: string
    }

    // ... later in the code ...

    // Map the results to the expected format
    const files = ((filesData as unknown as TrainedFileStat[]) || []).map((f) => ({
      filename: f.filename,
      chunkCount: Number(f.chunk_count),
      lastUpdated: f.last_updated,
    })).sort((a: TrainedFileResult, b: TrainedFileResult) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )

    console.log(`[Trained Files] Found ${files.length} unique files`)

    return NextResponse.json({
      success: true,
      files,
      totalFiles: files.length,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[Trained Files] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training files' },
      { status: 500 }
    )
  }
}
