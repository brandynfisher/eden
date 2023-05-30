// const withTM = require('next-transpile-modules')(['ui'])
// const withTM = require('next-transpile-modules')

// module.exports = withTM({
//   reactStrictMode: true,
//   webpack: config => {
//     config.resolve.fallback = { fs: false, net: false, tls: false }
//     return config
//   },
// })

module.exports = {
  reactStrictMode: true,
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
}
