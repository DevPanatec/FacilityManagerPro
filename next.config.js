/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    forceSwcTransforms: true
  },
  webpack: (config, { isServer }) => {
    // Configuración adicional de webpack si es necesaria
    return config
  }
}

module.exports = nextConfig 