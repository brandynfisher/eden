const path = require('path')
const withTM = require('next-transpile-modules')(['@edenlabs/eden-sdk'])

module.exports = withTM({
  output: 'standalone',
  experimental: {
    scrollRestoration: true,
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  headers: () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'no-store',
        },
      ],
    },
  ],
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
  images: {
    domains: [
      'https://minio.aws.abraham.fun/creations-stg/',
      'files.stripe.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minio.aws.abraham.fun',
        port: '',
        pathname: '**',
      },
    ],
  },
})

// @todo: revisit PWA / service worker
//
// const path = require('path')
//
// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   swcMinify: true,
//   compiler: {
//     removeConsole: process.env.NODE_ENV !== 'development',
//   },
//   output: 'standalone',
//   experimental: {
//     scrollRestoration: true,
//     outputFileTracingRoot: path.join(__dirname, '../../'),
//   },
//   webpack: config => {
//     config.resolve.fallback = { fs: false, net: false, tls: false }
//     return config
//   },
// };
//
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   disable: process.env.NODE_ENV === 'development',
//   register: true,
// });
//
// const withTM = require('next-transpile-modules')(['@edenlabs/eden-sdk'])
//
// module.exports = withPWA(withTM(nextConfig));
