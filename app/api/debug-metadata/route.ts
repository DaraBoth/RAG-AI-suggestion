import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Debug endpoint to check metadata structure
 */
export async function GET() {
  try {
    // Get ALL chunks to see all filenames
    const { data, error } = await supabase
      .from('chunks_table')
      .select('id, metadata, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Debug] Error fetching chunks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch chunks: ' + error.message },
        { status: 500 }
      )
    }

    // Group by filename
    const fileGroups: { [key: string]: number } = {}
    const fileSamples: { [key: string]: any } = {}
    
    data?.forEach((chunk: any) => {
      if (chunk.metadata && typeof chunk.metadata === 'object') {
        const filename = chunk.metadata.filename
        if (filename) {
          fileGroups[filename] = (fileGroups[filename] || 0) + 1
          // Keep one sample of each file
          if (!fileSamples[filename]) {
            fileSamples[filename] = {
              id: chunk.id,
              metadata: chunk.metadata,
              created_at: chunk.created_at,
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      totalChunksInDB: data?.length || 0,
      uniqueFilesFound: Object.keys(fileGroups).length,
      fileGroups,
      fileSamples,
      firstFiveChunks: data?.slice(0, 5).map((chunk: any) => ({
        id: chunk.id,
        filename: chunk.metadata?.filename,
        created_at: chunk.created_at,
      })),
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[Debug] Error:', error)
    return NextResponse.json(
      { error: 'Failed to debug metadata' },
      { status: 500 }
    )
  }
}
