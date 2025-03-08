import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dtut5r9j4w7j4.cloudfront.net',
      },
    ],
  },
}

export default nextConfig
