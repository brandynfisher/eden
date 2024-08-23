const defaultImageRemotePatterns = [
  {
    protocol: 'https',
    hostname: 'edenartlab-prod-data.s3.us-east-1.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'eden-creations-prod.s3.us-east-1.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'edenartlab-prod-data.s3.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'edenartlab-prod-data.s3-accelerate.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'edenartlab-stage-data.s3.us-east-1.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'eden-creations-stg.s3.us-east-1.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'edenartlab-stage-data.s3.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'edenartlab-stage-data.s3-accelerate.amazonaws.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'minio.aws.abraham.fun',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'dtut5r9j4w7j4.cloudfront.net',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'd14i3advvh2bvd.cloudfront.net',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'files.stripe.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'img.clerk.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'cdn.discordapp.com',
    port: '',
    pathname: '**',
  },
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com',
    port: '',
    pathname: '**',
  },
]

const devImageRemotePatterns = [{
  protocol: 'http',
  hostname: 'localhost',
  port: '',
  pathname: '**',
}]

const imageRemotePatterns =
  process.env.NODE_ENV === 'development'
    ? [...defaultImageRemotePatterns, ...devImageRemotePatterns]
    : defaultImageRemotePatterns


/** @type {import('next').NextConfig} */
let nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  images: {
    // loader: 'custom',
    // loaderFile: './image-loader.ts',
    minimumCacheTTL: 2433600,
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920, 2560],
    remotePatterns: imageRemotePatterns,
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
}

// Injected content via Sentry wizard below
if (process.env.NODE_ENV !== 'development') {
  const { withSentryConfig } = require('@sentry/nextjs')
  nextConfig = withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: 'edenlabs',
    project: 'eden2-frontend',

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: false,
  })
}

module.exports = nextConfig