module.exports = {
  ...require('@edenlabs/config/eslint-eden2.js'),
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  overrides: [
    {
      files: ['tests/**/ * '],
      env: {
        jest: true,
      },
    },
  ],
  extends: ['eslint:recommended', 'next', 'plugin:storybook/recommended'],
}
