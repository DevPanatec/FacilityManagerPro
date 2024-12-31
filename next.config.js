/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración básica
  output: 'standalone',
  trailingSlash: false,
  
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
        permanent: false,
      },
    ]
  },

  // Configuración de reescritura de rutas
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/auth/login',
        },
      ],
    }
  },

  // Configuración de imágenes
  images: {
    unoptimized: true,
    domains: ['*'],
  },

  // Configuración de headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' *; img-src 'self' * data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
          }
        ]
      }
    ]
  },

  // Configuración experimental
  experimental: {
    appDir: true,
    serverActions: true,
  },
}

module.exports = nextConfig 