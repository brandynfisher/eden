const params = [

  {
    name: 'init_image_data',
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
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Upscale uses [Width x Height] total number of pixels and adopts the aspect ratio of your provided image',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },


  ////////////////////////////////////////
  // optional generation args

  {
    name: 'n_samples',
    label: 'Samples',
    description: 'Number of variations to create',
    default: 1,
    allowedValues: [1, 2, 4],
    optional: true,
  },
  
  
  {
    name: 'text_input',
    label: 'Prompt',
    description: 'Text prompt for the upscale (leaving this empty will trigger CLIP-interrogator to automatically find a prompt matching your image)',
    default: null,
    optional: true,
  },
  
  {
    name: 'adopt_aspect_from_init_img',
    label: 'Adopt aspect ratio of Init image',
    description: 'Make sure the creation has the same aspect ratio as the Init image.',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  
  {
    name: 'uc_text',
    label: 'Negative prompt',
    description: 'Unconditional (negative) prompt',
    default:
      'nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, extra limbs, disfigured, deformed body, blurry, blurred, watermark, text, grainy, signature, cut off, draft',
    optional: true,
  },
  {
    name: 'guidance_scale',
    label: 'Guidance scale',
    description: 'Strength of prompt conditioning guidance',
    default: 7.5,
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
    name: 'checkpoint',
    label: 'Checkpoint',
    description: 'Which model checkpoint to generate with',
    default: 'sdxl-v1.0',
    allowedValues: ['sdxl-v1.0'],
    optional: true,
  },
  {
    name: 'lora',
    label: 'Concept',
    description:
      '(optional) Use Concept on top of the model. Make sure you use same base model Concept was trained on!',
    optional: true,
   },
   {
    name: 'lora_scale',
    label: 'Concept scale',
    description:
      'How strongly to apply the Concept weights (0.0 will result in the base model)',
    default: 0.8,
    minimum: 0.0,
    maximum: 1.2,
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
