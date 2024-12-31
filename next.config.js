/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración básica
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
        permanent: false,
      },
    ]
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
  }
}

module.exports = nextConfig 