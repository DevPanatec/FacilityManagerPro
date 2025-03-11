/** @type {import('next').NextConfig} */

// Importar las configuraciones CSP (solo funcionará en tiempo de construcción, no en tiempo de ejecución)
const specificHashes = [
  'sha256-Q+8tPsjVtiDsjF/Cv8FMOpg2Yg91oKFKDAJat1PPb2g=',
  'sha256-siOdv9navDThT+8MoXrcb/Kc8oDXskSlHEddzXrdjJU=',
  'sha256-r5XRWHwynX3nweId4lDaP8aMWsiNjy/wrW4QQyiVmhY=',
  'sha256-yc7cCOwI6XOC+YpDFGiu5KCZesDvZ84bBdULm2DAuHE=',
  'sha256-0e555M679pj1SEhYgM9HcLs+fMjbSnkd6toVzNTlK/Q=',
  'sha256-lma+TBE66mvjgzANpVBbhLZngjD8rD00zJJiiPHKUx8=',
  'sha256-kjUxnhKjABwjcxcuLEgp0OOXT0SsXpn2A7O9PH3fhxA=',
  'sha256-42sidmBuIALnnoPM2iUHjEQ/0KaNX++UdNLTOl3tocU='
];

// Crear la directiva CSP
const hashesString = specificHashes.map(hash => `'${hash}'`).join(' ');
const cspDirective = `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${hashesString} https:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; default-src 'self'; frame-src 'self' https:;`;

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
  webpack: (config) => {
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  },
  
  // Configuraciones de seguridad
  poweredByHeader: false, // Remover el header X-Powered-By
  
  // Desactivar explícitamente la política CSP nativa de Next.js
  experimental: {
    // Desactivar características experimentales que podrían estar habilitando el CSP
    optimizeCss: false,
    scrollRestoration: false,
    strictNextHead: false,
  },
  
  // Configurar headers para usar la CSP basada en hashes
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block'
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
        },
        {
          key: 'Content-Security-Policy',
          value: cspDirective
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        }
      ]
    }
  ],

  typescript: {
    // ⚠️ Ignorar errores de tipo durante la compilación
    ignoreBuildErrors: true,
  },
  
  // Deshabilitar la optimización de seguridad
  security: {
    // Esto podría no existir en tu versión de Next.js, pero es seguro incluirlo
    contentSecurityPolicy: false,
  },
}

module.exports = nextConfig; 