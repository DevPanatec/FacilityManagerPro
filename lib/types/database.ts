export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
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
      profiles: {
        Row: {
          id: string
          user_id: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
          user_id: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 