/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Configuración de rutas
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/auth/login',
      },
    ]
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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Configuración de páginas
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  // Configuración de compilación
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig 