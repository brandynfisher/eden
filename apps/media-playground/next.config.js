/** @type {import('next').NextConfig} */
module.exports = {
  //   trailingSlash: false,
  //   swcMinify: true,
    output: 'standalone',
  //   experimental: {
  //     optimizeCss: true, // enabling this will enable SSR for Tailwind
  //     scrollRestoration: true,
  //     outputFileTracingRoot: path.join(__dirname, '../../'),
  //   },
  //   crossOrigin: 'anonymous',
  //   webpack: config => {
  //     config.resolve.fallback = { fs: false, net: false, tls: false }
  //     return config
  //   },
  // }
}

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
module.exports = {
    images: {
        minimumCacheTTL: 2433600,
        deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920, 2560],
        remotePatterns: imageRemotePatterns,
    },
    output: 'standalone',
    reactStrictMode: false
}

// const { withSentryConfig } = require('@sentry/nextjs')
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: process.env.ANALYZE === 'true',
// })
// module.exports = withBundleAnalyzer(withNextPWA(
// module.exports = withNextPWA(
// module.exports = withSentryConfig(
//   // withBundleAnalyzer(
//   module.exports,
//   {
//       // For all available options, see:
//       // https://github.com/getsentry/sentry-webpack-plugin#options
//
//       // Suppresses source map uploading logs during build
//       silent: true,
//       org: 'edenlabs',
//       project: 'eden-frontend',
//   },
//   {
//       // For all available options, see:
//       // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
//
//       // Upload a larger set of source maps for prettier stack traces (increases build time)
//       widenClientFileUpload: true,
//
//       // Transpiles SDK to be compatible with IE11 (increases bundle size)
//       transpileClientSDK: false,
//
//       // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
//       tunnelRoute: '/monitoring',
//
//       // Hides source maps from generated client bundles
//       hideSourceMaps: true,
//
//       // Automatically tree-shake Sentry logger statements to reduce bundle size
//       disableLogger: true,
//   },
//   // ),
// )