import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/app/providers'
import RealtimeManager from './components/RealtimeManager'
import { ChatWidget } from '@/app/components/Chat/ChatWidget'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false
})

export const metadata = {
  title: 'Facility Manager Pro',
  description: 'Sistema de gestión de instalaciones y mantenimiento',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <RealtimeManager />
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  )
} 