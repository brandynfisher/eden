const params = [

  {
    name: 'init_image_data',
    label: 'Init image',
    description:
      'URL of image to initiate image before diffusion (if null, use random noise)',
    default: null,
    mediaUpload: true,
    isRequired: true,
  },
  {
    name: 'init_image_strength',
    label: 'Init image strength',
    description:
      'How much to weight the input init image in the diffusion process. Setting this to 0.0 will only use the guessed prompt and no img_guidance',
    default: 0.2,
    minimum: 0.0,
    maximum: 0.8,
    step: 0.01,
  },
  {
    name: 'checkpoint',
    label: 'Checkpoint',
    description: 'Which model checkpoint to generate with',
    default: 'sdxl-v1.0',
    allowedValues: ['sdxl-v1.0'],
  },
  //{
  //  name: 'lora',
  //  label: 'LORA',
  //  description:
  //    '(optional) Use LORA on top of the model. To prompt, use <lora_name> e.g. "A photo of <Bill>". Make sure you load LORA on top of the base model is was trained on!',
  //  default: '(none)',
  //  // allowedValues: ['(none)'],
  //},
  //{
  //  name: 'lora_scale',
  //  label: 'LORA scale',
  //  description:
  //    'How strongly to apply the LoRa weights (0.0 will result in the base model)',
  //  default: 0.8,
  //  minimum: 0.0,
  //  maximum: 1.2,
  //  step: 0.1,
  //},
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
    name: 'upscale_f',
    label: 'Upscale Factor',
    description: 'Diffusion-based upscaling factor',
    default: 1.4,
    minimum: 1.0,
    maximum: 2.0,
    step: 0.1,
  },


  ////////////////////////////////////////
  // optional generation args

  {
    name: 'n_samples',
    label: 'Samples',
    description: 'Number of samples to create remix',
    default: 1,
    allowedValues: [1, 2, 4],
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
    default: 40,
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
