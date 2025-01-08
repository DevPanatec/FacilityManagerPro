import './globals.css'
import { Inter } from 'next/font/google'
import SessionProvider from './providers/SessionProvider'
import { createClient } from '@/utils/supabase/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Facility Manager Pro',
  description: 'Sistema de gestión para hospitales y centros médicos',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider initialSession={session}>
          <main className="min-h-screen flex flex-col items-center">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  )
} 
