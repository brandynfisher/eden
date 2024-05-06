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
    output: 'standalone',
    reactStrictMode: false,
    images: {
        minimumCacheTTL: 2433600,
        deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920, 2560],
        remotePatterns: imageRemotePatterns,
    },
  //   trailingSlash: false,
  //   swcMinify: true,
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
    publicRuntimeConfig: {
        NEXT_PUBLIC_EDEN_API_URL:
          process.env.NEXT_PUBLIC_EDEN_API_URL || 'http://0.0.0.0:5050',
        NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST || 'http://localhost:3000',
        NEXT_PUBLIC_DISCORD_CLIENT_ID:
          process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '',
        NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
        NEXT_PUBLIC_CLOUDINARY_API_KEY:
          process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
        NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET:
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
        NEXT_PUBLIC_GOOGLE_GTM_ID:
          process.env.NEXT_PUBLIC_GOOGLE_GTM_ID || '',
        NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID:
          process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_MEASUREMENT_ID || '',
        NEXT_PUBLIC_DEV_TYPE: process.env.NEXT_PUBLIC_DEV_TYPE || 'eden',
    },
    serverRuntimeConfig: {
        API_URL: process.env.EDEN_API_URL || 'http://0.0.0.0:5050',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        EDEN_ADMIN_API_KEY: process.env.EDEN_ADMIN_API_KEY || '',
        EDEN_ADMIN_API_SECRET: process.env.EDEN_ADMIN_API_SECRET || '',
        EDEN_MAINTENANCE_MODE: process.env.EDEN_MAINTENANCE_MODE || false,
    }
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