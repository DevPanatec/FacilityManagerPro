export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ApiError {
  message: string
  status: number
  code?: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: string
          status: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          hospital_id: string | null
          created_at: string
          updated_at: string
          last_activity: string | null
          failed_login_attempts: number
          last_password_change: string | null
          last_login_ip: string | null
          is_locked: boolean
          lock_until: string | null
          metadata: Json | null
        }
        Insert: {
          id: string
          email: string
          role?: string
          status?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          hospital_id?: string | null
          created_at?: string
          updated_at?: string
          last_activity?: string | null
          failed_login_attempts?: number
          last_password_change?: string | null
          last_login_ip?: string | null
          is_locked?: boolean
          lock_until?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          email?: string
          role?: string
          status?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          hospital_id?: string | null
          created_at?: string
          updated_at?: string
          last_activity?: string | null
          failed_login_attempts?: number
          last_password_change?: string | null
          last_login_ip?: string | null
          is_locked?: boolean
          lock_until?: string | null
          metadata?: Json | null
        }
      }
      hospitals: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          type: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          description: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          description: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          description?: string
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
