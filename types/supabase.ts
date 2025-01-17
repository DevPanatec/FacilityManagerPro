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
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          status: 'active' | 'inactive'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'inactive'
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          user_id: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          message: string
          type?: 'info' | 'success' | 'warning' | 'error'
          user_id: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error'
          user_id?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          description: string | null
          quantity: number
          unit: string
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          quantity: number
          unit: string
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          quantity?: number
          unit?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          created_by: string
          assigned_to: string | null
          organization_id: string
          area_id: string | null
          created_at: string
          updated_at: string
          due_date: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_by: string
          assigned_to?: string | null
          organization_id: string
          area_id?: string | null
          created_at?: string
          updated_at?: string
          due_date?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          created_by?: string
          assigned_to?: string | null
          organization_id?: string
          area_id?: string | null
          created_at?: string
          updated_at?: string
          due_date?: string | null
        }
      }
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
          id?: string
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
      messages: {
        Row: {
          id: string
          content: string
          user_id: string
          room_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          room_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          room_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
