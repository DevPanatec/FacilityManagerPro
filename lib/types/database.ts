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
<<<<<<< Updated upstream
          role: string
=======
          role: 'admin' | 'enterprise' | 'user'
>>>>>>> Stashed changes
          status: string
          first_name: string | null
          last_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
<<<<<<< Updated upstream
          id?: string
          email: string
          role: string
=======
          id: string
          email: string
          role?: 'admin' | 'enterprise' | 'user'
>>>>>>> Stashed changes
          status?: string
          first_name?: string | null
          last_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
<<<<<<< Updated upstream
          role?: string
=======
          role?: 'admin' | 'enterprise' | 'user'
>>>>>>> Stashed changes
          status?: string
          first_name?: string | null
          last_name?: string | null
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