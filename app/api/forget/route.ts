import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * DELETE endpoint to remove trained data by filename
 * This allows users to "forget" specific training files
 */
export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    console.log(`[Forget] Attempting to delete chunks for file: ${filename}`)

    // First, get the storage path before deleting chunks
    const { data: chunks, error: fetchError } = await supabase
      .from('chunks_table')
      .select('metadata')
      .eq('metadata->>filename', filename)
      .limit(1)

    const storagePath = (chunks as any)?.[0]?.metadata?.storage_path

    // Delete all chunks with matching filename in metadata
    const { data, error } = await supabase
      .from('chunks_table')
      .delete()
      .eq('metadata->>filename', filename)
      .select()

    if (error) {
      console.error('[Forget] Error deleting chunks:', error)
      return NextResponse.json(
        { error: 'Failed to delete chunks: ' + error.message },
        { status: 500 }
      )
    }

    const deletedCount = data?.length || 0
    console.log(`[Forget] Successfully deleted ${deletedCount} chunks for file: ${filename}`)

    // Delete the original file from storage if it exists (with timeout protection)
    let storageDeleted = false
    if (storagePath) {
      console.log(`[Forget] Deleting original file from storage: ${storagePath}`)
      
      try {
        // Add a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage deletion timeout')), 8000)
        )
        
        const deletePromise = supabase.storage
          .from('training-files')
          .remove([storagePath])
        
        const { error: storageError } = await Promise.race([
          deletePromise,
          timeoutPromise
        ]) as any

        if (storageError) {
          console.error('[Forget] Error deleting file from storage:', storageError)
        } else {
          console.log(`[Forget] Successfully deleted file from storage`)
          storageDeleted = true
        }
      } catch (timeoutError) {
        console.error('[Forget] Storage deletion timed out:', timeoutError)
        // Continue anyway - chunks are already deleted which is the most important part
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} chunks from "${filename}"${storagePath && !storageDeleted ? ' (storage file deletion may have failed)' : ''}`,
      deletedCount,
      filename,
      storageDeleted,
    })
  } catch (error) {
    console.error('[Forget] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete training data' },
      { status: 500 }
    )
  }
}
