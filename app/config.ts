// Runtime configuration
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'edge'
export const preferredRegion = 'auto'
export const maxDuration = 60

// Metadata
export const metadata = {
  title: 'Facility Manager Pro',
  description: 'Sistema de gestión de instalaciones y mantenimiento',
}

// Auth configuration
export const authConfig = {
  flowType: 'pkce',
  detectSessionInUrl: true,
  persistSession: true,
  autoRefreshToken: true,
  debug: process.env.NODE_ENV === 'development',
  cookieOptions: {
    name: 'sb-session',
    lifetime: 60 * 60 * 24 * 7, // 1 week
    domain: process.env.NEXT_PUBLIC_DOMAIN || undefined,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  }
} 
