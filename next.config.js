/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de dominio
  basePath: '',
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://gestionhbc.com' : '',
  
  // Deshabilitando la generación estática para acelerar el build
  output: 'standalone',
  
  // Reduciendo el análisis estático
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configuración de redirecciones
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/login',
        permanent: true,
      },
    ]
  },

  // Configuración de imágenes y dominios permitidos
  images: {
    domains: ['gestionhbc.com', 'jecxswfoepdstrghyouv.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gestionhbc.com',
      },
      {
        protocol: 'https',
        hostname: 'jecxswfoepdstrghyouv.supabase.co',
      }
    ]
  },

  // Configuración de headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' https://gestionhbc.com https://*.supabase.co; img-src 'self' https: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 