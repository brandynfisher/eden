import animateParameters from './_animate.js'
import baseParameters from './_base.js'

const params = [
  ...baseParameters,
  ...animateParameters,
  {
    name: 'interpolation_texts',
    label: 'Prompts',
    description: 'Prompts to interpolate through',
    default: [],
    minLength: 2,
    maxLength: 8,
    isRequired: true,
  },
  {
    name: 'interpolation_seeds',
    label: 'Seeds',
    description:
      'Random seeds. Must have 1 for each prompt. If left blank, will be set randomly.',
    default: [],
    optional: true,
  },
]

export default params;
