export type UserRole = 'admin' | 'user' | 'guest' 

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  status: 'active' | 'inactive' | 'pending'
  last_activity?: string
  created_at: string
} 

export interface AuthResponse {
  success: boolean
  error?: string
  code?: string
}

export interface AuthState {
  isLoading: boolean
  error: string | null
  user: User | null
} 

export interface AuthUser {
  id: string
  email?: string
  role?: string
  metadata?: {
    name?: string
    avatar_url?: string
  }
}

export interface AuthSession {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  expiresAt?: number
}

export interface AuthError {
  message: string
  status?: number
} 