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
      profiles: {
        Row: {
          id: string
          email: string
          role: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name: string | null
          last_name: string | null
          status: 'active' | 'inactive' | 'pending'
          hospital_id: string | null
          avatar_url: string | null
          metadata: Json
          last_sign_in_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name?: string | null
          last_name?: string | null
          status?: 'active' | 'inactive' | 'pending'
          hospital_id?: string | null
          avatar_url?: string | null
          metadata?: Json
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name?: string | null
          last_name?: string | null
          status?: 'active' | 'inactive' | 'pending'
          hospital_id?: string | null
          avatar_url?: string | null
          metadata?: Json
          last_sign_in_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hospitals: {
        Row: {
          id: string
          name: string
          address: string | null
          phone: string | null
          email: string | null
          status: 'active' | 'inactive' | 'pending'
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          phone?: string | null
          email?: string | null
          status?: 'active' | 'inactive' | 'pending'
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          phone?: string | null
          email?: string | null
          status?: 'active' | 'inactive' | 'pending'
          metadata?: Json
          created_at?: string
          updated_at?: string
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