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
          created_at: string
          updated_at: string
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
          role: string
          organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: string
          organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      salas: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          estado: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          estado?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          estado?: boolean
          created_at?: string
        }
      }
      areas: {
        Row: {
          id: string
          nombre: string
          descripcion: string | null
          estado: boolean
          created_at: string
          sala_id: string | null
        }
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          estado?: boolean
          created_at?: string
          sala_id?: string | null
        }
        Update: {
          id?: string
          nombre?: string
          descripcion?: string | null
          estado?: boolean
          created_at?: string
          sala_id?: string | null
        }
      }
    }
  }
}

export type Sala = Database['public']['Tables']['salas']['Row']
export type Area = Database['public']['Tables']['areas']['Row'] 
