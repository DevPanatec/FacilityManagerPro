import type { User, Session } from '@supabase/supabase-js'

export type AuthError = {
  message: string
  status?: number
}

export type AuthResponse = {
  error?: AuthError
  success?: boolean
  data?: {
    user: User | null
    session: Session | null
  }
}

export type Profile = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
} 