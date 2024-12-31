/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: true,
  basePath: '/facility-manager-pro',
  
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

  // Configuración de páginas
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  // Configuración de compilación
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 