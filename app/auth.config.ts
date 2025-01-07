import type { NextAuthConfig } from 'next-auth'

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/auth/register'
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    }
  },
  providers: [], // Configured in auth.ts
}

// We set these configurations to ensure proper cookie handling in Edge runtime
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
export const preferredRegion = 'auto'
export const revalidate = 0

// Cookie configuration
export const cookieOptions = {
  name: 'sb-session',
  lifetime: 60 * 60 * 24 * 7, // 1 week
  domain: process.env.NEXT_PUBLIC_DOMAIN || undefined,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production'
}

// Auth configuration
export const authOptions = {
  flowType: 'pkce',
  detectSessionInUrl: true,
  persistSession: true,
  autoRefreshToken: true,
  debug: process.env.NODE_ENV === 'development',
  cookieOptions
} 
