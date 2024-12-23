/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['jecxswfoepdstrghyouv.supabase.co'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  }
}

export default nextConfig
