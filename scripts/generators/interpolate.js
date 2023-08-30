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
    name: 'checkpoint',
    label: 'Checkpoint',
    description: 'Which model checkpoint to generate with',
    default: 'sdxl-v1.0',
    allowedValues: ['sdxl-v1.0'],
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
  // {
  //   name: 'upscale_f',
  //   label: 'Upscale Factor',
  //   description: 'Diffusion-based upscaling factor',
  //   default: 1.4,
  //   minimum: 1.0,
  //   maximum: 2.0,
  //   step: 0.1,
  // },
  {
    name: 'n_frames',
    label: 'Frames',
    description: 'Number of frames in the video',
    default: 50,
    minimum: 10,
    maximum: 600,
  },
  {
    name: 'loop',
    label: 'Loop',
    description: 'Loop the output video',
    default: true,
    allowedValues: [false, true],
  },


  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'lora',
    label: 'Concept',
    description:
      '(optional) Use Concept on top of the model. Make sure you use same base model Concept was trained on!',
    default: '(none)',
    // allowedValues: ['(none)'],
   },
   {
    name: 'lora_scale',
    label: 'Concept scale',
    description:
      'How strongly to apply the Concept weights (0.0 will result in the base model)',
    default: 0.8,
    minimum: 0.0,
    maximum: 1.2,
    step: 0.1,
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
    description: 'Sampler to use for generation (Euler recommended)',
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
      'Optimize video for perceptual smoothness between frames (if false, frames are linearly spaced in prompt conditioning space)',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  
  {
    name: 'latent_blending_skip_f',
    label: 'Denoising skip fractions (very advanced)',
    description:
      'What fraction of denoising steps to skip at the start and end of the render. Higher values result in smoother video (will also render faster), too high values will look more like crossfading in pixel space.',
    default: [0.2, 0.75],
    optional: true,
  },
  
  {
    name: 'n_film',
    label: 'FILM Iterations',
    description:
      'Optionally apply FILM postprocessing to the generated frames to create a smoother video',
    default: 1,
    allowedValues: [0, 1, 2, 3],
    optional: true,
  },
  {
    name: 'fps',
    label: 'FPS',
    description: 'Frames per second of the output video (by default, will be 2x this with n_film=1)',
    default: 12,
    minimum: 1,
    maximum: 30,
    optional: true,
  },


  ////////////////////////////////////////
  // optional interpolation args

  {
    name: 'interpolation_seeds',
    label: 'Seeds',
    description:
      'Random seeds. Must have 1 for each prompt. If left blank, will be set randomly.',
    default: [],
    optional: true,
  },

  ////////////////////////////////////////
  // stream intermediate results

  {
    name: 'stream',
    label: 'Stream',
    description:
      'Yield intermediate frames during creation process (if false, only final video is returned)',
    default: false,
    allowedValues: [false, true],
    optional: true,
  },
  {
    name: 'stream_every',
    label: 'Stream every',
    description:
      'How often to yield intermediate results (when stream is true). In sampling steps for images, frames for video.',
    default: 10,
    minimum: 1,
    maximum: 25,
    optional: true,
  },

]

export default params;
