/** @type {import('next').NextConfig} */
const nextConfig = {
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
        hostname: 'vercel.app',
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
    ],
    domains: ['wldiefpqmfjxernvuywv.supabase.co'],
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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: 'sha256-Q+8tPsjVtiDsjF/Cv8FMOpg2Yg91oKFKDAJat1PPb2g=' 'sha256-cSFrgH63iDmNEj+4jnkEbvmbfI92IV6ty347f6Nwxc0=' 'sha256-sfTqQGq7t0Lg5pN+ktO4QQsDHnpixjOJ8gmcFT0ZImM=' 'sha256-B7/iPQIEcYHYOH/saWxQvkgYR8pE7lfEVqQegjBl5LY=' 'sha256-0e555M679pj1SEhYgM9HcLs+fMjbSnkd6toVzNTlK/Q='",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://* lh3.googleusercontent.com",
              "font-src 'self' data: https:",
              "connect-src 'self' wss://* https://* *.supabase.co *.googleapis.com vercel.live",
              "frame-src 'self' https: accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "require-trusted-types-for 'script'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig; 