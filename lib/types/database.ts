export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'superadmin' | 'admin' | 'enterprise' | 'usuario'
          first_name: string | null
          last_name: string | null
          status: 'active' | 'inactive' | 'pending'
          organization_id: string | null
          avatar_url: string | null
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
          organization_id?: string | null
          avatar_url?: string | null
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
          organization_id?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          logo_url?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          logo_url?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 