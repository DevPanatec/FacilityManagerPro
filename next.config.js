/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
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
  }
}

module.exports = nextConfig 