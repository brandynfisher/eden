/** @type {import('next').NextConfig} */
const nextConfig = {
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
