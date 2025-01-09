/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    forceSwcTransforms: true
  },
  compiler: {
    styledComponents: true,
    removeConsole: process.env.NODE_ENV === 'production'
  }
}

module.exports = nextConfig 