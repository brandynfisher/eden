module.exports = {
  ...require('@edenlabs/config/eslint-eden2'),
  parserOptions: {
    root: true,
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.lint.json'],
  },
  ignorePatterns: ['dist', 'node_modules'],
}
