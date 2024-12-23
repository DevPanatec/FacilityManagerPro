/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['jecxswfoepdstrghyouv.supabase.co'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  experimental: {
    serverActions: true
  }
}

export default nextConfig
