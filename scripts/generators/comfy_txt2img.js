const params = [
  {
    name: 'text_input',
    label: 'Prompt',
    description: 'Text prompt for the creation',
    default: null,
    isRequired: true,
  },

  {
    name: 'width',
    label: 'Width',
    description: 'Max width of the creation in pixels',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Max height of the creation in pixels',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  
  {
    name: 'n_samples',
    label: 'Variations',
    description: 'Number of variations to create',
    default: 1,
    allowedValues: [1, 2, 3, 4],
    optional: true,
  },

  {
    name: 'uc_text',
    label: 'Negative prompt',
    description: 'What you DONT want to see',
    default:
      'watermark, text, nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, blurry, blurred, grainy, signature, cut off, draft',
    optional: true,
  },

  {
    name: 'guidance_scale',
    label: 'Prompt strength',
    description: 'Higher values usually also increase saturation and constrast',
    default: 8.0,
    minimum: 0.0,
    maximum: 20.0,
    step: 0.1,
    optional: true,
  },
  {
    name: 'steps',
    label: 'Steps',
    description: 'Number of denoising steps (recommended to use >30)',
    default: 35,
    minimum: 5,
    maximum: 50,
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

export default params;
