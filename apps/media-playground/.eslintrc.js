module.exports = {
  ...require('@edenlabs/config/eslint-eden2.js'),
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  extends: ['eslint:recommended', 'next', 'plugin:storybook/recommended'],
}
