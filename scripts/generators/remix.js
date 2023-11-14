const params = [

  {
    name: 'init_image',
    label: 'Starting image',
    description:
      'The image you want to remix',
    default: null,
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: true,
  },
  {
    name: 'init_image_strength',
    label: 'Starting image strength',
    description:
      'How much to weight the starting image. Setting to 0 will try to reimagine the image. Higher values will stay closer to the original.',
    default: 0.05,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
  },
  {
    name: 'width',
    label: 'Width',
    description: 'Remix uses [Width x Height] total number of pixels and adopts the aspect ratio of your provided image',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Remix uses [Width x Height] total number of pixels and adopts the aspect ratio of your provided image',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },

  
  {
    name: 'text_input',
    label: 'Prompt',
    description: 'Optional text prompt for the remix (will try to remix the image in the direction of the prompt (style-transfer))',
    default: null,
  },
  
  {
    name: 'ip_image_strength',
    label: 'Image strength (vs prompt strength)',
    description: 'How much to use the image (1.0) vs the prompt (0.0)',
    default: 0.65,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.1,
  },

  ////////////////////////////////////////
  // optional generation args
  {
    name: 'n_samples',
    label: 'Samples',
    description: 'Number of variations to create',
    default: 1,
    allowedValues: [1, 2, 3, 4],
    optional: true,
  },

  {
    name: 'adopt_aspect_from_init_img',
    label: 'Adopt aspect ratio of starting image',
    description: 'Make a creation with the same aspect ratio as the starting image',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  
  {
    name: 'upscale_f',
    label: 'Upscale Factor',
    description: 'Upscale the image with this factor after generation (1.0 = no upscaling)',
    default: 1.0,
    minimum: 1.0,
    maximum: 2.0,
    step: 0.01,
    optional: true,
  },

  {
    name: 'uc_text',
    label: 'Negative prompt',
    description: 'what you DONT want to see',
    default:
      'nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, extra limbs, disfigured, deformed body, blurry, blurred, watermark, text, grainy, signature, cut off, draft',
    optional: true,
  },
  {
    name: 'guidance_scale',
    label: 'Guidance scale',
    description: 'Strength of prompt conditioning guidance',
    default: 7.0,
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
