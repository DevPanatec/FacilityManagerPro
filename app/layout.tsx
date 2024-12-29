import localFont from "next/font/local"
import "./globals.css"
import { Toaster } from 'react-hot-toast'
import RouteGuard from './auth/components/RouteGuard'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

export const metadata = {
  title: "Hombres de Blanco",
  description: "Sistema de Gestión Hospitalaria",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <GoogleAnalytics />
        <Toaster position="top-center" />
        <RouteGuard>
          <Suspense fallback={<div>Cargando...</div>}>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </Suspense>
        </RouteGuard>
      </body>
    </html>
  )
} 