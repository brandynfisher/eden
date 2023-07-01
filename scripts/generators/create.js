import baseParameters from './_base.js'

const params = [
  ...baseParameters,
  {
    name: 'text_input',
    label: 'Prompt',
    description: 'Text prompt for the creation',
    default: null,
    isRequired: true,
  },
  {
    name: 'uc_text',
    label: 'Negative prompt',
    description: 'Unconditional (negative) prompt: what you DONT want to see',
    default:
      'watermark, text, nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, blurry, blurred, grainy, signature, cut off, draft',
    optional: true,
  },
  {
    name: 'init_image_data',
    label: 'Init image',
    default: null,
    description:
      'URL of image to initiate image before diffusion (if null, use random noise)',
    mediaUpload: true,
    optional: true,
  },
  {
    name: 'init_image_strength',
    label: 'Init image strength',
    description:
      'How much to weight the initial image in the diffusion process (closer to 1.0 = more influence)',
    default: 0.0,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },
  {
    name: 'n_samples',
    label: 'Samples',
    description: 'Number of samples to create',
    default: 1,
    allowedValues: [1, 2, 4],
    optional: true,
  },
  {
    name: 'seed',
    label: 'Seed',
    description:
      'Set random seed for reproducibility. If blank, will be set randomly.',
    default: null,
    minimum: 0,
    maximum: 1e8,
    optional: true,
  },
]

const createGeneratorVersion = {
  provider: 'replicate',
  address: 'abraham-ai/eden-sd-pipelines',
  versionId: '64ad779915a333d4870dc6c1a33cb61bb0be973be6393dacdcbce15a788e63cd',
  mode: 'generate',
  parameters: params,
  isDeprecated: false,
}

const createGenerator = {
  generatorName: 'create',
  description: 'Create an image from a prompt',
  output: 'creation',
  versions: [createGeneratorVersion],
}

export default createGenerator
