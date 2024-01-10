const params = [

  {
    name: 'init_image',
    label: 'Style image',
    description:
      'The style image for your video-style-transfer',
    default: null,
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: true,
  },

  {
    name: 'input_video_path',
    label: 'Input video/GIF',
    description:
      'Input video/GIF to drive the motion/shape of the animation (should be short)',
    default: null,
    mediaUpload: 'video/mp4, video/webm, image/gif',
    isRequired: true,
  },


  ////////////////////////////////////////
  // optional generation args

  {
    name: 'n_frames',
    label: 'Number of frames',
    description: 'How many frames to render (suggested 64-128), use at least 28 frames per prompt to get good transitions.',
    default: 64,
    minimum: 32,
    maximum: 264,
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
    name: 'denoise_strength',
    label: 'AI strength',
    description: 'How much AI denoising to apply to the input video/gif (1.0 = fully reimagine input, 0.0 = return input as is)',
    default: 0.95,
    minimum: 0.2,
    maximum: 1.0,
    step: 0.01,
  },


  {
    name: 'controlnet_strength',
    label: 'Shape Control strength',
    description: 'How much the shape of the input video/gif drives the shape of the result',
    default: 0.8,
    minimum: 0.0,
    maximum: 1.2,
    step: 0.01,
  },
  
  {
    name: 'loop',
    label: 'loop video',
    description: 'Try to make a loop-able video (end=start). This sometimes makes the result worse..',
    default: false,
    allowedValues: [false, true],
  },


  ////////////////////////////////////////
  // advanced generation args

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
