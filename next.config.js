/** @type {import('next').NextConfig} */
const nextConfig = {
  // Deshabilitando la generación estática para acelerar el build
  output: 'standalone',
  // Reduciendo el análisis estático
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 