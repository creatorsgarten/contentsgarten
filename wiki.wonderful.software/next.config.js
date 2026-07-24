/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // firebase/auth pulls in undici, which uses syntax this webpack
    // version's parser can't handle. undici isn't needed here — stub it out.
    config.resolve.alias = { ...config.resolve.alias, undici: false }
    return config
  },
}

module.exports = nextConfig
