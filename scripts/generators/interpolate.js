import baseParameters from './_base.js'
import animateParameters from './_animate.js'

export default [
  ...baseParameters,
  ...animateParameters,
  {
    name: 'interpolation_texts',
    label: 'Prompts',
    description: 'Prompts to interpolate through',
    default: [],
    minLength: 2,
    maxLength: 5,
    isRequired: true,
  },
  {
    name: 'interpolation_seeds',
    label: 'Seeds',
    description: 'Random seeds. Must have 1 for each prompt. If left blank, will be set randomly.',
    default: [],
    optional: true,
  }
]
