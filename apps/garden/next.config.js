const path = require('path')
const withTM = require('next-transpile-modules')(['@edenlabs/eden-sdk'])

module.exports = withTM({
  output: 'standalone',
  experimental: {
    scrollRestoration: true,
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
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
