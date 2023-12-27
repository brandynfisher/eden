const params = [
  
  {
    name: 'interpolation_init_images',
    label: 'Your images',
    description: 'Images to blend (must be exactly two images!)',
    default: [],
    mediaUpload: 'image/png, image/jpeg, image/webp',
    minLength: 2,
    maxLength: 2,
    isRequired: true,
  },
  {
    name: 'width',
    label: 'Width',
    description: 'blend uses [Width x Height] total number of pixels and adopts the average aspect ratio of your provided images',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'blend uses [Width x Height] total number of pixels and adopts the average aspect ratio of your provided images',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  

  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'lora',
    label: 'Concept',
    description:
      '(optional) Use Concept on top of the model. Make sure you use same base model Concept was trained on!',
    optional: true,
   },
  {
    name: 'lora_scale',
    label: 'Concept strength',
    description:
      'How strongly to activate the concept. Lower this value if your prompt is being ignored and all creations look too similar to your training images',
    default: 0.7,
    minimum: 0.0,
    maximum: 1.2,
    step: 0.02,
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
    label: 'Prompt strength',
    description: 'Higher values usually also increase saturation and constrast',
    default: 8.0,
    minimum: 0.0,
    maximum: 20.0,
    step: 0.1,
    optional: true,
  },

  {
    name: 'interpolation_init_images_min_strength',
    label: 'Image strengths',
    description:
      'Strength of the images during blending. Low values (recommended) will give the blend more freedom, higher values will look more like alpha-blending of the original images. Recommended values are 0.0 - 0.1',
    default: 0.02,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.02,
    optional: true,
  },

  {
    name: 'sampler',
    label: 'Sampler',
    description: 'Sampler to use for generation (Euler recommended)',
    default: 'euler',
    allowedValues: ["ddim", "ddpm", "klms", "euler"],
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
    name: 'interpolation_texts',
    label: 'Override prompts',
    description: 'Optional: Override internal prompts with these ones',
    default: [],
    minLength: 2,
    maxLength: 2,
    isRequired: false,
    optional: true
  },
  {
    name: 'interpolation_seeds',
    label: 'Interpolation seeds',
    description:
      'Random seeds. Must have 1 for each init image. If left blank, will be set randomly.',
    default: [],
    optional: true,
    minLength: 2,
    maxLength: 2,
  },

]

export default params;
