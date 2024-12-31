import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Facility Manager Pro',
  description: 'Sistema de gestión de instalaciones',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
} 