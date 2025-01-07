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
      users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          email?: string
          role?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          expires_at: string
          created_at: string
        }
      }
      audit_logs: {
        Row: {
          id: number
          user_id: string
          action: string
          metadata: Json
          created_at: string
        }
      }
    }
    Functions: {
      audit_log: {
        Args: {
          p_user_id: string
          p_action: string
          p_metadata: Json
        }
        Returns: void
      }
    }
  }
} 