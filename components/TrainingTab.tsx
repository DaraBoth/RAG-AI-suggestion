'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, CheckCircle2, XCircle, Loader2, Database, FileStack, Calendar, BarChart3 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import ShimmerButton from '@/components/ui/shimmer-button'
import NumberTicker from '@/components/ui/number-ticker'
import { BorderBeam } from '@/components/ui/border-beam'
import Sparkles from '@/components/ui/sparkles'

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error'
  message: string
  filename?: string
  chunks?: number
}

interface TrainingStats {
  totalChunks: number
  totalFiles: number
  totalCharacters: number
  files: string[]
  lastTrainingDate: string | null
  lastTrainingFile: string | null
}

export default function TrainingTab() {
  const uploadStatus = useAppStore((state) => state.trainingUploadStatus)
  const setUploadStatus = useAppStore((state) => state.setTrainingUploadStatus)
  const [stats, setStats] = useState<TrainingStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  // Fetch training statistics
  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const response = await fetch('/api/training-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch training stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // Set up Supabase real-time subscription with fallback
  useEffect(() => {
    fetchStats() // Initial fetch

    try {
      // Try to use Supabase real-time subscription
      const { supabase } = require('@/lib/supabase')
      
      const channel = supabase
        .channel('chunks_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'chunks_table'
          },
          (payload: any) => {
            console.log('Real-time update detected:', payload)
            // Refresh stats when any change occurs
            fetchStats()
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            console.log('Real-time subscription active for training stats')
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('Real-time subscription failed, falling back to polling')
          }
        })

      // Cleanup subscription on unmount
      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.log('Real-time not available, using polling fallback:', error)
      // Fallback to polling if real-time fails
      const interval = setInterval(() => {
        fetchStats()
      }, 5000) // Poll every 5 seconds as fallback

      return () => clearInterval(interval)
    }
  }, [fetchStats])

  // Immediate refresh after successful upload
  useEffect(() => {
    if (uploadStatus.status === 'success') {
      fetchStats()
    }
  }, [uploadStatus.status, fetchStats])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]

    if (file.type !== 'application/pdf') {
      setUploadStatus({
        status: 'error',
        message: 'Please upload a PDF file',
      })
      return
    }

    setUploadStatus({
      status: 'uploading',
      message: `Uploading ${file.name}...`,
      filename: file.name,
    })

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/train', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUploadStatus({
          status: 'success',
          message: data.message,
          filename: data.filename,
          chunks: data.chunks,
        })
      } else {
        setUploadStatus({
          status: 'error',
          message: data.error || 'Failed to process PDF',
        })
      }
    } catch (error) {
      setUploadStatus({
        status: 'error',
        message: 'Network error. Please try again.',
      })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: uploadStatus.status === 'uploading',
  })

  const resetUpload = () => {
    setUploadStatus({
      status: 'idle',
      message: '',
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Training Statistics */}
      {stats && stats.totalChunks > 0 && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden">
            <BorderBeam size={200} duration={12} delay={0} />
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Chunks</p>
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    <NumberTicker key={`chunks-${stats.totalChunks}`} value={loadingStats ? 0 : stats.totalChunks} />
                  </div>
                </div>
                <Database className="h-6 w-6 sm:h-8 sm:w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden">
            <BorderBeam size={200} duration={12} delay={3} />
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Files Trained</p>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                    <NumberTicker key={`files-${stats.totalFiles}`} value={loadingStats ? 0 : stats.totalFiles} />
                  </div>
                </div>
                <FileStack className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden">
            <BorderBeam size={200} duration={12} delay={6} />
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Characters</p>
                  <div className="text-xl sm:text-2xl font-bold text-blue-400">
                    <NumberTicker key={`chars-${stats.totalCharacters}`} value={loadingStats ? 0 : stats.totalCharacters / 1000} decimalPlaces={1} />K
                  </div>
                </div>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden">
            <BorderBeam size={200} duration={12} delay={9} />
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">Last Training</p>
                  <p className="text-xs sm:text-sm font-medium text-purple-400 truncate">
                    {stats.lastTrainingDate 
                      ? new Date(stats.lastTrainingDate).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'
                    }
                  </p>
                </div>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400/50 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-white/10 bg-white/5 backdrop-blur-xl relative overflow-hidden">
        <BorderBeam size={250} duration={15} delay={0} />
        <CardHeader className="p-4 sm:p-6">
          <Sparkles
            className="inline-block"
            density={60}
            size={1}
            speed={1.2}
            color="#a78bfa"
          >
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Train Your AI
            </CardTitle>
          </Sparkles>
          <CardDescription className="text-xs sm:text-sm">
            Upload PDF files to train the AI with your custom content. The text will be chunked
            and embedded for intelligent suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div
            {...getRootProps()}
            className={`
              relative rounded-lg border-2 border-dashed p-6 sm:p-12 text-center transition-all
              ${
                isDragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-white/20 hover:border-white/40 hover:bg-white/5'
              }
              ${uploadStatus.status === 'uploading' ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
          >
            <input {...getInputProps()} />
            
            {uploadStatus.status === 'idle' && (
              <div className="space-y-3 sm:space-y-4">
                <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                <div>
                  <p className="text-sm sm:text-lg font-medium">
                    {isDragActive ? 'Drop your PDF here' : 'Drop PDF file here or click to browse'}
                  </p>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                    Supports PDF files up to 10MB
                  </p>
                </div>
              </div>
            )}

            {uploadStatus.status === 'uploading' && (
              <div className="space-y-3 sm:space-y-4">
                <Loader2 className="mx-auto h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary" />
                <div>
                  <p className="text-sm sm:text-lg font-medium">{uploadStatus.message}</p>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-muted-foreground">
                    Processing your PDF and generating embeddings...
                  </p>
                </div>
              </div>
            )}

            {uploadStatus.status === 'success' && (
              <div className="space-y-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                <div>
                  <p className="text-lg font-medium text-green-500">Upload Successful!</p>
                  <p className="mt-2 text-sm text-muted-foreground">{uploadStatus.message}</p>
                  {uploadStatus.chunks && (
                    <p className="mt-1 text-sm font-medium text-primary">
                      {uploadStatus.chunks} chunks processed
                    </p>
                  )}
                </div>
                <ShimmerButton 
                  onClick={resetUpload} 
                  className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                >
                  Upload Another PDF
                </ShimmerButton>
              </div>
            )}

            {uploadStatus.status === 'error' && (
              <div className="space-y-4">
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
                <div>
                  <p className="text-lg font-medium text-red-500">Upload Failed</p>
                  <p className="mt-2 text-sm text-muted-foreground">{uploadStatus.message}</p>
                </div>
                <ShimmerButton 
                  onClick={resetUpload} 
                  className="mt-4 bg-gradient-to-r from-orange-600 to-red-600 text-white"
                >
                  Try Again
                </ShimmerButton>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex gap-3">
              <FileText className="h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">How it works:</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Upload a PDF document with the content you want the AI to learn</li>
                  <li>The text is automatically extracted and split into manageable chunks</li>
                  <li>Each chunk is converted to embeddings using OpenAI</li>
                  <li>Embeddings are stored in Supabase vector database</li>
                  <li>AI uses semantic search to provide relevant suggestions as you type</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Trained Files List */}
          {stats && stats.files.length > 0 && (
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex gap-3">
                <FileStack className="h-5 w-5 shrink-0 text-emerald-400" />
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-2">Trained Files:</p>
                  <div className="space-y-1">
                    {stats.files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 text-emerald-400/70" />
                        <span className="truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
