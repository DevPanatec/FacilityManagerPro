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
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name?: string
          avatar_url?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          email: string
          name?: string
          avatar_url?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description?: string
          status: string
          priority: string
          assigned_to?: string
          created_by: string
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status: string
          priority: string
          assigned_to?: string
          created_by: string
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: string
          priority?: string
          assigned_to?: string
          created_by?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          task_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          content: string
          task_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          task_id?: string
          created_by?: string
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
