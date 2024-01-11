const params = [

  {
    name: 'init_image',
    label: 'Image to animate',
    description:
      'The image you want to animate',
    default: null,
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: true,
  },

  {
    name: 'n_frames',
    label: 'Number of frames',
    description: 'How many frames to render',
    default: 28,
    minimum: 16,
    maximum: 64,
    step: 4,
  },
  
  {
    name: 'width',
    label: 'Width',
    description: 'Max width of the creation in pixels',
    default: 1280,
    minimum: 1024,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Max height of the creation in pixels',
    default: 1280,
    minimum: 1024,
    maximum: 2048,
    step: 64,
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
