module.exports = {
  ...require('@edenlabs/config/eslint-garden.js'),
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: './tsconfig.json',
  },
  extends: ["eslint:recommended", "next"]
}
