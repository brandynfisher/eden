const params = [
  
  {
    name: 'prompt',
    label: 'Prompts',
    description: 'Prompts to interpolate through',
    default: [],
    minLength: 1,
    maxLength: 8,
    isRequired: true,
  },

  {
    name: 'n_frames',
    label: 'Number of frames',
    description: 'How many frames to render (suggested 64-128), use at least 28 frames per prompt to get good transitions.',
    default: 64,
    minimum: 32,
    maximum: 264,
    step: 4,
  },
  
  ////////////////////////////////////////
  // optional generation args

  {
    name: 'width',
    label: 'Width',
    description: 'Width of the creation in pixels',
    default: 768,
    minimum: 512,
    maximum: 1024,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Height of the creation in pixels',
    default: 512,
    minimum: 512,
    maximum: 1024,
    step: 64,
  },
  


]

export default params;
