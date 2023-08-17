const params = [
  {
    name: 'text_input',
    label: 'Prompt',
    description: 'Text prompt for the creation',
    default: null,
    isRequired: true,
  },
  {
    name: 'checkpoint',
    label: 'Checkpoint',
    description: 'Which model checkpoint to generate with',
    default: 'sdxl-v1.0',
    allowedValues: ['sdxl-v1.0'],
  },
  // {
  //   name: 'lora',
  //   label: 'LORA',
  //   description:
  //     '(optional) Use LORA on top of the model. To prompt, use <lora_name> e.g. "A photo of <Bill>". Make sure you load LORA on top of the base model it was trained on!',
  //   default: '(none)',
  //   // allowedValues: ['(none)'],
  // },
  // {
  //   name: 'lora_scale',
  //   label: 'LORA scale',
  //   description:
  //     'How strongly to apply the LoRa weights (0.0 will result in the base model)',
  //   default: 0.8,
  //   minimum: 0.0,
  //   maximum: 1.2,
  //   step: 0.1,
  // },
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
    description: 'Diffusion-based up-scaling factor',
    default: 1.4,
    minimum: 1.0,
    maximum: 2.0,
    step: 0.1,
  },


  ////////////////////////////////////////
  // optional generation args

  {
    name: 'controlnet_type',
    label: 'ControlNet',
    description: 'Which ControlNet to use (or off to disable)',
    default: 'off',
    allowedValues: ["off", "canny-edge"],
    optional: true,
  },
  {
    name: 'init_image_data',
    label: 'ControlNet or Init image',
    default: null,
    description:
      'Guidance image. If ControlNet is off, this drives colors and rough shapes. If ControlNet is canny-edge, this will guide edges and contours',
    mediaUpload: true,
    optional: true,
  },
  {
    name: 'init_image_strength',
    label: 'Init image strength',
    description:
      'How much influence the guidance image has on the creation. Recommended <0.2 with Controlnet off, >0.5 otherwise.',
    default: 0.4,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },
  {
    name: 'n_samples',
    label: 'Samples',
    description: 'Number of samples to create',
    default: 1,
    allowedValues: [1, 2, 4],
    optional: true,
  },
  {
    name: 'uc_text',
    label: 'Negative prompt',
    description: 'Unconditional (negative) prompt: what you DONT want to see',
    default:
      'watermark, text, nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, blurry, blurred, grainy, signature, cut off, draft',
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
