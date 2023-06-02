module.exports = {
  ...require('@eden-labs/config/eslint-garden.js'),
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
}
