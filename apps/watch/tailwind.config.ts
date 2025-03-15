import { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: ['./src/{app,components,features}/**/*.{ts,tsx}'],
  prefix: '',
  theme: {},
  plugins: [],
} satisfies Config

export default config
