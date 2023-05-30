module.exports = {
  ...require('config/eslint-garden.js'),
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
}
