import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/app/providers'
import RealtimeManager from './components/RealtimeManager'
import { ChatWidget } from '@/app/components/Chat/ChatWidget'
import dynamic from 'next/dynamic'

// Importar el componente CSPFix dinámicamente para que solo se cargue en el cliente
const CSPFix = dynamic(() => import('./components/CSPFix'), { ssr: false })

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
        {/* Añadir script para corregir la CSP */}
        <script src="/csp-fix.js" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {/* Componente para manejar la CSP dinámicamente */}
          <CSPFix />
          <RealtimeManager />
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  )
} 