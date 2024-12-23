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
    appDir: true,
  }
}

export default nextConfig
