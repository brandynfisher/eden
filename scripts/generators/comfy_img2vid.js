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
    description: 'How many frames to render (suggested 28-64)',
    default: 28,
    minimum: 16,
    maximum: 64,
    step: 4,
  },
  
  {
    name: 'width',
    label: 'Width',
    description: 'Width of the creation in pixels',
    default: 768,
    minimum: 512,
    maximum: 1536,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Height of the creation in pixels',
    default: 768,
    minimum: 512,
    maximum: 1536,
    step: 64,
  },
  
  ////////////////////////////////////////
  // optional generation args


]

export default params;
