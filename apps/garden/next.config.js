const path = require('path')
const withTM = require('next-transpile-modules')(['@edenlabs/eden-sdk'])
// const runtimeCaching = require('next-pwa/cache')

const defaultImageDomains = [
  'https://minio.aws.abraham.fun/creations-stg/',
  'https://eden-creations-prod.s3.us-east-1.amazonaws.com/',
  'https://eden-creations-stg.s3.us-east-1.amazonaws.com/',
  'https://edenartlab-prod-data.s3.us-east-1.amazonaws.com',
  'https://edenartlab-stg-data.s3.us-east-1.amazonaws.com',
  'https://edenartlab-stage-data.s3.us-east-1.amazonaws.com/',
  'files.stripe.com',
  'img.clerk.com',
  'eden-creations-stg.s3.us-east-1.amazonaws.com',
  'eden-creations-prod.s3.us-east-1.amazonaws.com',
  'edenartlab-prod-data.s3.us-east-1.amazonaws.com',
  'edenartlab-stg-data.s3.us-east-1.amazonaws.com',
  'edenartlab-stage-data.s3.us-east-1.amazonaws.com',
]

const devImageDomains = ['localhost']

const imageDomains =
  process.env.NODE_ENV === 'development'
    ? [...defaultImageDomains, ...devImageDomains]
    : defaultImageDomains

module.exports = withTM({
  async redirects() {
    return [
      process.env.EDEN_MAINTENANCE_MODE === 'true'
        ? {
            source: '/((?!maintenance|downtime|android-chrome-192x192).*)',
            destination: '/maintenance.html',
            permanent: false,
          }
        : {
            source: '/maintenance.html',
            destination: '/',
            permanent: false,
          },
    ]
  },
  trailingSlash: false,
  swcMinify: true,
  output: 'standalone',
  experimental: {
    optimizeCss: true, // enabling this will enable SSR for Tailwind
    scrollRestoration: true,
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
  images: {
    // deviceSizes: [320, 640, 828, 1080, 1200, 1920, 2048, 3840],
    // imageSizes: [32, 64, 96, 128, 256, 300],
    minimumCacheTTL: 2433600,
    domains: imageDomains,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'minio.aws.abraham.fun',
        port: '',
        pathname: '**',
      },
    ],
  },
  env: {
    XYZ: process.env.XYZ,
    NEXT_PUBLIC_XYZ: process.env.XYZ,
  },
  modularizeImports: {
    '@ant-design/icons': {
      transform: '@ant-design/icons/{{member}}',
    },
    'antd': {
      transform: 'antd/lib/{{kebabCase member}}',
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
  },
})

const withNextPWA = require('next-pwa')({
  dest: 'public',
  // runtimeCaching,
  disable: process.env.NODE_ENV === 'development',
  register: true,
})

// Injected content via Sentry wizard below

const { withSentryConfig } = require('@sentry/nextjs')
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// })
// module.exports = withBundleAnalyzer(withNextPWA(
module.exports = withNextPWA(
  withSentryConfig(
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
      transpileClientSDK: false,

      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
      tunnelRoute: '/monitoring',

      // Hides source maps from generated client bundles
      hideSourceMaps: true,

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
    },
  ),
)
// )