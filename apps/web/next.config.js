/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'aimak-api.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

module.exports = nextConfig
