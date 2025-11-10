/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  webpack: (config, { isServer }) => {
    // Handle monorepo package resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/api-client': require('path').resolve(__dirname, '../../packages/api-client'),
    }
    return config
  },
}

module.exports = nextConfig

