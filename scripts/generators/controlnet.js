const params = [
  {
    name: 'control_image',
    label: 'Shape guidance image',
    default: null,
    description:
      'Shape guidance image. This will guide the edges and contours or colors of the creation',
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: true,
    optional: false,
  },
  {
    name: 'control_image_strength',
    label: 'Guidance strength',
    description:
      'How much influence the guidance image has on the creation. Recommended >0.5',
    default: 0.6,
    minimum: 0.0,
    maximum: 1.2,
    step: 0.01,
    optional: false,
  },
  
  {
    name: 'controlnet_type',
    label: 'Control mode',
    description: 'Which ControlNet mode to use. canny-edge will maintain lines and edges (good for faces or subtle details). Luminance will maintain dark and bright regions (good for colors). Depth will try to maintain the perceived depth in the image.',
    default: 'luminance',
    allowedValues: ["luminance", "canny-edge", "depth"],
  },
  
  {
    name: 'text_input',
    label: 'Prompt',
    description: 'Text prompt for the creation',
    default: null,
    isRequired: true,
    optional: false,
  },
  {
    name: 'width',
    label: 'Width',
    description: 'Controlnet mode will generate a total of [Width x Height] pixels but adopts the aspect ratio of your guidance image (unless adopt aspect is turned off)',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
    optional: false,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Controlnet mode will generate a total of [Width x Height] pixels but adopts the aspect ratio of your guidance image (unless adopt aspect is turned off)',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
    optional: false,
  },

  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'n_samples',
    label: 'Variations',
    description: 'Number of variations to create',
    default: 1,
    allowedValues: [1, 2, 3, 4],
    optional: true,
  },

  {
    name: 'lora',
    label: 'Concept',
    description:
      '(optional) activate a trained concept',
    optional: true,
  },
  {
    name: 'lora_scale',
    label: 'Concept strength',
    description:
      'How strongly to activate the concept. Lower this value if your prompt is being ignored and all creations look too similar to your training images',
    default: 0.6,
    minimum: 0.0,
    maximum: 1.2,
    step: 0.02,
    optional: true,
  },
  
  {
    name: 'adopt_aspect_from_init_img',
    label: 'Adopt aspect',
    description: 'Make a creation with the same aspect ratio as the guidance image',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  {
    name: 'uc_text',
    label: 'Negative prompt',
    description: 'What you DONT want to see',
    default:
      'watermark, text, nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, blurry, blurred, grainy, signature, cut off, draft',
    isRequired: false,
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
    name: 'sampler',
    label: 'Sampler',
    description: 'Sampler to use for generation',
    default: 'euler',
    allowedValues: ["ddim", "ddpm", "klms", "euler", "euler_ancestral", "dpm", "kdpm2", "kdpm2_ancestral", "pndm"],
    optional: true,
  },

  {
    name: 'steps',
    label: 'Steps',
    description: 'Number of denoising steps (recommended to use >30)',
    default: 40,
    minimum: 5,
    maximum: 70,
    optional: true,
  },

  // {
  //   name: 'checkpoint',
  //   label: 'Checkpoint',
  //   description: 'Which generator model to use',
  //   default: 'juggernaut_XL2',
  //   allowedValues: ["juggernaut_XL2", "sdxl-v1.0"],
  //   optional: true,
  // },
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
