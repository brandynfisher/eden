const params = [

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
    name: 'width',
    label: 'Width',
    description: 'Width of the creation in pixels',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Height of the creation in pixels',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'n_frames',
    label: 'Frames',
    description: 'Number of frames in the video (increase when you use many prompts)',
    default: 60,
    minimum: 10,
    maximum: 600,
  },


  ////////////////////////////////////////
  // optional generation args

  {
    name: 'lora',
    label: 'Concept',
    description:
      '(optional) activate a trained concept',
    optional: true,
  },
  {
    name: 'lora_scale',
    label: 'Concept scale',
    description:
      'How strongly to activate the concept (0.0 will disable the concept)',
    default: 0.8,
    minimum: 0.0,
    maximum: 1.5,
    step: 0.01,
    optional: true,
  },

  {
    name: 'control_image',
    label: 'Shape guidance image',
    default: null,
    description:
      'Shape guidance image. This will guide the edges and contours of the creation. Make sure to set ControlNet mode when using this!!',
    mediaUpload: 'image/png, image/jpeg, image/webp',
    optional: true,
  },
  {
    name: 'control_image_strength',
    label: 'Shape guidance image strength',
    description:
      'How much influence the guidance image has on the creation. Recommended >0.5',
    default: 0.6,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },
  
  {
    name: 'controlnet_type',
    label: 'ControlNet mode',
    description: 'Which ControlNet mode to use (we recommend canny-edge or luminance)',
    default: 'off',
    allowedValues: ["off", "luminance", "canny-edge", "depth"],
    optional: true,
  },

  {
    name: 'init_image',
    label: 'Starting image',
    default: null,
    description:
      'The AI will start imagining from this image (can be used to guide colors and rough shapes or composition)',
    mediaUpload: 'image/png, image/jpeg, image/webp',
    optional: true,
  },
  {
    name: 'init_image_strength',
    label: 'Starting image strength',
    description:
      'How much influence the starting image has on the creation. Recommended <0.1. Using this in combination with a shape guidance image is not recommended!',
    default: 0.05,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },

  {
    name: 'loop',
    label: 'Loop',
    description: 'Loop the output video',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },

  {
    name: 'uc_text',
    label: 'Negative prompt',
    description: 'What you DONT want to see',
    default:
      'nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, extra limbs, disfigured, deformed body, blurry, blurred, watermark, text, grainy, signature, cut off, draft',
    optional: true,
  },
  {
    name: 'guidance_scale',
    label: 'Guidance scale',
    description: 'Strength of the prompt (higher values result in more contrast and color saturation)',
    default: 7.0,
    minimum: 0.0,
    maximum: 20.0,
    step: 0.1,
    optional: true,
  },
  {
    name: 'sampler',
    label: 'Sampler',
    description: 'Sampler to use for generation (Euler highly recommended)',
    default: 'euler',
    allowedValues: ["ddim", "ddpm", "klms", "euler"],
    optional: true,
  },
  {
    name: 'steps',
    label: 'Steps',
    description: 'Number of denoising steps (recommended to use >30)',
    default: 35,
    minimum: 5,
    maximum: 70,
    optional: true,
  },
  {
    name: 'smooth',
    label: 'Smooth',
    description:
      'Use video smoothing (highly recommended). Turning this off leads to a very different aesthetic with more frame flicker',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  
  {
    name: 'n_film',
    label: 'FILM Iterations',
    description:
      'Optionally apply FILM postprocessing to create a smoother video (1 = highly recommended)',
    default: 1,
    allowedValues: [0, 1, 2, 3],
    optional: true,
  },
  
  {
    name: 'fps',
    label: 'FPS',
    description: 'Frames per second of the output video',
    default: 12,
    minimum: 1,
    maximum: 30,
    optional: true,
  },

  {
    name: 'interpolation_seeds',
    label: 'Seeds',
    description:
      'Random seeds. Must have 1 for each prompt. If left blank, will be set randomly.',
    default: [],
    optional: true,
    minLength: 2,
    maxLength: 8,
  },

]

export default params;
