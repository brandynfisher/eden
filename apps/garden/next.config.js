const path = require('path')
const withTM = require('next-transpile-modules')(['@edenlabs/eden-sdk'])

module.exports = withTM({
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
})
