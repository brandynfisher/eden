import baseParameters from './_base.js'
import animateParameters from './_animate.js'

const params = [
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
    description:
      'Random seeds. Must have 1 for each prompt. If left blank, will be set randomly.',
    default: [],
    optional: true,
  },
]

const interpolateGeneratorVersion = {
  provider: 'replicate',
  address: 'abraham-ai/eden-sd-pipelines',
  versionId: '64ad779915a333d4870dc6c1a33cb61bb0be973be6393dacdcbce15a788e63cd',
  mode: 'interpolate',
  parameters: params,
  isDeprecated: false,
}

const interpolateGenerator = {
  generatorName: 'interpolate',
  description: 'Create a video interpolation between two prompts',
  output: 'creation',
  versions: [interpolateGeneratorVersion],
}

export default interpolateGenerator
