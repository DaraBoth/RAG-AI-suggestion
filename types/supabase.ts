export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      chunks_table: {
        Row: {
          id: number
          content: string
          embedding: number[]
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          content: string
          embedding: number[]
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          content?: string
          embedding?: number[]
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Functions: {
      match_chunks: {
        Args: {
          query_embedding: number[]
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: number
          content: string
          metadata: Json | null
          similarity: number
        }[]
      }
    }
  }
}

export type ChunkRow = Database['public']['Tables']['chunks_table']['Row']
export type ChunkInsert = Database['public']['Tables']['chunks_table']['Insert']
