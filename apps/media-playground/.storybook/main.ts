import type { StorybookConfig } from '@storybook/nextjs'
import { dirname, join } from 'path'
import type { RuleSetRule, Configuration as WebpackConfig } from 'webpack'

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, 'package.json')))
}

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.mdx',
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../app/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@chromatic-com/storybook'),
    getAbsolutePath('@storybook/addon-interactions'),
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('storybook-addon-pseudo-states'),
    getAbsolutePath('@storybook/addon-mdx-gfm'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/nextjs'),
    options: {
      builder: {},
    },
  },

  docs: {},
  staticDirs: ['../public'],

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },

  /**
   * Override the SCSS rule to force `sass-loader` to use our local `sass`
   * (the official Dart Sass), preventing any fallback to node-sass.
   */
  webpackFinal: async (webpackConfig: WebpackConfig) => {
    const rules = webpackConfig.module?.rules ?? []

    // Locate the rule that handles SCSS
    const scssRule = rules.find(rule => {
      // Bail if it's not a valid object rule
      if (!rule || typeof rule !== 'object') return false

      const testRegex = (rule as RuleSetRule).test
      // If test is a RegExp, check whether it matches ".scss"
      return testRegex instanceof RegExp && testRegex.test('.scss')
    }) as RuleSetRule | undefined

    if (scssRule && Array.isArray(scssRule.use)) {
      scssRule.use.forEach(useEntry => {
        if (
          typeof useEntry === 'object' &&
          'loader' in useEntry &&
          typeof useEntry.loader === 'string' &&
          useEntry.loader.includes('sass-loader')
        ) {
          // Force the loader to use Dart Sass
          useEntry.options = {
            //@ts-ignore
            ...useEntry.options,
            implementation: require('sass'),
          }
        }
      })
    }

    return webpackConfig
  },
}

export default config
