/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // AVIF first: fabric textures are 20-30% smaller than WebP at the same quality. Supplier photos
    // rarely change, so keep optimised copies for 30 days instead of re-fetching them every minute.
    formats: ['image/avif', 'image/webp'],
    // Supplier photos are 1,010 px wide, so the default widths above 1080 (up to 3840) returned the
    // same picture while each was billed as a separate transformation.
    deviceSizes: [640, 828, 1080],
    minimumCacheTTL: 60 * 60 * 24 * 30,
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
