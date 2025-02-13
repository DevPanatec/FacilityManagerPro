/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wldiefpqmfjxernvuywv.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'gestionhbc.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      }
    ]
  },
  typescript: {
    ignoreBuildErrors: true
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.app https://*.vercel.sh https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.supabase.co https://*.githubusercontent.com https://*.vercel.app; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.app wss://*.vercel.app https://vercel.live wss://ws.pusherapp.com https://*.pusher.com https://*.pusherapp.com https://*.supabase.co:* wss://*.supabase.co:* https://api.ipify.org https://*.vercel.sh https://wldiefpqmfjxernvuywv.supabase.co https://*.supabase.co/rest/v1/* https://*.supabase.co/auth/v1/* https://*.supabase.co/storage/v1/* https://*.supabase.co/realtime/v1/* wss://*.supabase.co/realtime/v1/* https://*.supabase.co/rest/* https://*.supabase.co/auth/* https://*.supabase.co/storage/* https://*.supabase.co/realtime/*; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests"
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig; 