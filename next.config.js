/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.charlottefabrics.com',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-7e5f5ae157894c8c95bbc5f77e2929f0.r2.dev',
      },
    ],
  },
}

module.exports = nextConfig
