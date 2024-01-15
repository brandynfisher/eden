const params = [

  {
    name: 'init_image',
    label: 'Image you want to upscale',
    description:
      'The image you want to upscale',
    default: null,
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: true,
  },

  {
    name: 'denoise_strength',
    label: 'Creativity strength',
    description: 'High values (0.5-0.7) will give the upscale more freedom to invent new details, low values (0.2-0.4) will keep the upscale closer to the original image',
    default: 0.45,
    minimum: 0.1,
    maximum: 1.0,
    step: 0.05,
  },

  {
    name: 'width',
    label: 'Width',
    description: 'Max width of the creation in pixels',
    default: 1600,
    minimum: 1024,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Max height of the creation in pixels',
    default: 1600,
    minimum: 1024,
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
