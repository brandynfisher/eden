const params = [

  {
    name: 'init_image',
    label: 'Init image',
    description:
      'The image you want to upscale',
    default: null,
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: true,
  },
  {
    name: 'init_image_strength',
    label: 'Init image strength',
    description:
      'How much to weight the input init image in the diffusion process. Recommended 0.3-0.6, Lower values will drift away from the input image more, but will imagine new details more easily, possibly leading to a sharper final image.',
    default: 0.45,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
  },

  {
    name: 'width',
    label: 'Width',
    description: 'Upscale uses [Width x Height] total number of pixels and adopts the aspect ratio of your provided image',
    default: 1600,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Upscale uses [Width x Height] total number of pixels and adopts the aspect ratio of your provided image',
    default: 1600,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  
  {
    name: 'text_input',
    label: 'Prompt',
    description: 'Text prompt for the upscale (leaving this empty will automatically find a prompt matching your image)',
    default: null,
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
    default: 6.0,
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
    default: 60,
    minimum: 5,
    maximum: 70,
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
