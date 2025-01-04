import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import RealtimeManager from './components/RealtimeManager'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="es" data-theme="light">
      <body className={inter.className}>
        <Providers>
          {children}
          <RealtimeManager />
        </Providers>
      </body>
    </html>
  )
} 