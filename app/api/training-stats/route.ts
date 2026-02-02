import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Get total number of chunks
    const { count: totalChunks, error: countError } = await supabase
      .from('chunks_table')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error counting chunks:', countError)
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }

    // Use SQL aggregation for accuracy and performance (bypasses row limit)
    const { data: statsData, error: statsError } = await supabase
      .from('chunks_table')
      .select('metadata')
      .not('metadata->filename', 'is', null)

    if (statsError) {
      console.error('Error fetching stats data:', statsError)
    }

    // Get unique files and sum characters using RPC results for consistency
    const { data: fileStats, error: rpcError } = await supabase
      .rpc('get_trained_files_stats')

    if (rpcError) {
      console.error('Error fetching file stats RPC:', rpcError)
    }

    const fileNames = new Set<string>()
    let totalCharacters = 0

    // We already have the totalChunks from the head query above

    interface TrainedFileStat {
      filename: string
    }

    if (fileStats) {
      (fileStats as unknown as TrainedFileStat[]).forEach((f) => {
        fileNames.add(f.filename)
      })
    }

    // Calculate total characters more efficiently
    // Note: If this becomes too large, we should add a 'total_characters' column to a metadata table
    // For now, selecting metadata which is smaller than selecting content
    const { data: charData, error: charError } = await supabase
      .from('chunks_table')
      .select('metadata->characters')

    if (!charError && charData) {
      totalCharacters = charData.reduce((sum: number, row: { characters: unknown }) => sum + (Number(row.characters) || 0), 0)
    }

    // Get most recent training
    const { data: latestChunk, error: latestError } = await supabase
      .from('chunks_table')
      .select('metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let lastTrainingDate: string | null = null
    let lastTrainingFile: string | null = null

    interface ChunkData {
      created_at: string
      metadata: {
        filename?: string
      } | null
    }

    if (!latestError && latestChunk) {
      const chunk = latestChunk as unknown as ChunkData
      lastTrainingDate = chunk.created_at
      lastTrainingFile = chunk.metadata?.filename || null
    }

    return NextResponse.json({
      totalChunks: totalChunks || 0,
      totalFiles: fileNames.size,
      totalCharacters,
      files: Array.from(fileNames),
      lastTrainingDate,
      lastTrainingFile,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })
  } catch (error) {
    console.error('Training stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch training statistics' },
      { status: 500 }
    )
  }
}
