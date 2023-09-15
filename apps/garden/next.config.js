const path = require('path')
const withTM = require('next-transpile-modules')(['@edenlabs/eden-sdk'])
const runtimeCaching = require("next-pwa/cache");
module.exports = withTM({
  swcMinify: true,
  output: 'standalone',
  experimental: {
    scrollRestoration: true,
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = {fs: false, net: false, tls: false}
    return config
  },
  images: {
    domains: [
      'https://minio.aws.abraham.fun/creations-stg/',
      'https://eden-creations-stg.s3.us-east-1.amazonaws.com/',
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

const withNextPWA = require('next-pwa')({
  dest: 'public',
  runtimeCaching,
  disable: process.env.NODE_ENV === 'development',
  register: true,
});

// Injected content via Sentry wizard below

const {withSentryConfig} = require('@sentry/nextjs')

module.exports = withNextPWA(withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: 'edenlabs',
    project: 'eden-frontend',
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
))
