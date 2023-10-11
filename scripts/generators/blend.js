const params = [
  
  {
    name: 'interpolation_init_images',
    label: 'Your images',
    description: 'Images to blend (should be exactly two images!)',
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
  
  {
    name: 'interpolation_init_images_min_strength',
    label: 'Init image min strength',
    description:
      'Min strength of the init_img during blending. Lower values will give the blend more freedom to diverge from the source images, higher values will try to keep color patterns and composition',
    default: 0.05,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
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
    description: 'Strength of the prompt (higher values usually increase saturation and constrast)',
    default: 7.5,
    minimum: 0.0,
    maximum: 20.0,
    step: 0.1,
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
  },
  {
    name: 'checkpoint',
    label: 'Checkpoint',
    description: 'Which model checkpoint to generate with',
    default: 'sdxl-v1.0',
    allowedValues: ['sdxl-v1.0'],
    optional: true,
  },

]

export default params;
