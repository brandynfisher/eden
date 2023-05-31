const withTM = require('next-transpile-modules')(['@eden-labs/eden-sdk'])

module.exports = withTM({
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
})
