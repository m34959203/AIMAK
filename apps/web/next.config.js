/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Включаем экспериментальные функции для улучшения кэширования
  experimental: {
    // Турбо-режим для более быстрой разработки
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Оптимизация для production сборки
  productionBrowserSourceMaps: false,

  // Webpack кэширование для быстрых пересборок
  webpack: (config, { dev, isServer }) => {
    // Включаем кэширование для всех режимов (dev и production)
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: '.next/cache/webpack',
    };
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'aimak-api.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'aimak-api-w8ps.onrender.com',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
    // Включаем unoptimized для всех сред, чтобы избежать проблем с изображениями
    unoptimized: true,
  },
}

module.exports = nextConfig
