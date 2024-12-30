import localFont from "next/font/local"
import "./globals.css"
import Script from 'next/script'
import 'leaflet/dist/leaflet.css'
import { Toaster } from 'react-hot-toast'
import RouteGuard from './auth/components/RouteGuard'

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
      <body>
        <Toaster position="top-center" />
        <RouteGuard>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </RouteGuard>
      </body>
    </html>
  )
} 