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
      'How strongly to activate the concept. Lower this value if your prompt is being ignored and all creations look too similar to your training images.',
    default: 0.7,
    minimum: 0.0,
    maximum: 1.2,
    step: 0.02,
    optional: true,
  },
  {
    name: 'init_image',
    label: 'Starting image',
    default: null,
    description:
      'Will use a blurry version of this image as starting point (can be used to guide colors and rough shapes or composition)',
    mediaUpload: 'image/png, image/jpeg, image/webp',
    optional: true,
  },
  {
    name: 'init_image_strength',
    label: 'Image strength',
    description:
      'How much influence the starting image (if there is one) has on the creation. Recommended <0.2',
    default: 0.15,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },
  
  {
    name: 'adopt_aspect_from_init_img',
    label: 'Adopt aspect',
    description: 'Make a creation with the same aspect ratio as the starting image',
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
    description: 'Diffusion sampler to use for generation',
    default: 'euler',
    allowedValues: ["ddim", "ddpm", "klms", "euler", "euler_ancestral", "dpm", "kdpm2", "kdpm2_ancestral", "pndm"],
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
