/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'aimak-api.onrender.com'],
  },
}

module.exports = nextConfig
