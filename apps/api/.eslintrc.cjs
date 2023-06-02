module.exports = {
  ...require('@eden-labs/config/eslint-api'),
  parserOptions: {
    root: true,
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.lint.json'],
  },
}
