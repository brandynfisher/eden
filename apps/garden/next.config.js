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

// Injected content via Sentry wizard below

const { withSentryConfig } = require('@sentry/nextjs')

if (process.env.NODE_ENV !== 'development') {
  module.exports = withSentryConfig(
    module.exports,
    {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options

      // Suppresses source map uploading logs during build
      silent: true,

      org: process.env.NEXT_PUBLIC_SENTRY_ORG,
      project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
    },
    {
      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Transpiles SDK to be compatible with IE11 (increases bundle size)
      transpileClientSDK: true,

      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
      tunnelRoute: '/monitoring',

      // Hides source maps from generated client bundles
      hideSourceMaps: true,

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
    },
  )
}
