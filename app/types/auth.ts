export interface AuthError {
  message: string
  status?: number
}

export interface AuthResponse {
  error?: AuthError
  success?: boolean
}

export interface Profile {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
} 