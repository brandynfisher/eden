const params = [
  
  {
    name: 'interpolation_init_images',
    label: 'Your images',
    description: 'Images to use as keyframes for the interpolation video',
    default: [],
    mediaUpload: 'image/png, image/jpeg, image/webp',
    minLength: 2,
    maxLength: 8,
    isRequired: true,
  },
  {
    name: 'width',
    label: 'Width',
    description: 'real2real uses [Width x Height] total number of pixels and adopts the average aspect ratio of your provided images',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'real2real uses [Width x Height] total number of pixels and adopts the average aspect ratio of your provided images',
    default: 1024,
    minimum: 512,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'n_frames',
    label: 'Frames',
    description: 'Number of frames in the video (increase when you use many images)',
    default: 60,
    minimum: 10,
    maximum: 600,
  },

  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'loop',
    label: 'Loop',
    description: 'Make the video loopable (end=start)',
    default: true,
    allowedValues: [false, true],
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
    name: 'interpolation_texts',
    label: 'Override prompts',
    description: 'Optional: Override real2real internal prompts with these ones (length must match number of images)',
    default: [],
    minLength: 2,
    maxLength: 8,
    isRequired: false,
    optional: true
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
    label: 'Guidance scale (cfg_scale)',
    description: 'Strength of prompt guidance, higher values result in frames with more saturation and contrast',
    default: 7.0,
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
      'Use video smoothing (highly recommended), turning this off leads to a very different aesthetic with more frame flicker',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  
  {
    name: 'latent_blending_skip_f',
    label: 'Denoising skip fractions (very advanced)',
    description:
      'Fraction of denoising to skip at the start/end of the animation. Higher values result in smoother video (will also render faster), too high values will look more like crossfading in pixel space.',
    default: [0.1, 0.65],
    minLength: 2,
    maxLength: 2,
    optional: true,
  },
  
  {
    name: 'n_film',
    label: 'FILM Iterations',
    description:
      'Optionally apply FILM postprocessing to create a smoother video (1 = highly recommended)',
    default: 1,
    allowedValues: [0, 1, 2, 3],
    optional: true,
  },
  {
    name: 'fps',
    label: 'FPS',
    description: 'Frames per second of the output video',
    default: 12,
    minimum: 1,
    maximum: 30,
    optional: true,
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
    name: 'interpolation_init_images_min_strength',
    label: 'Init image min strength',
    description:
      'Min strength of the init_img during interpolation. Lower values will give the interpolation more freedom, leading to more visual changes at the cost of less smoothness. Higher values will look more like alpha-fading the images.',
    default: 0.05,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },
  {
    name: 'interpolation_init_images_max_strength',
    label: 'Init image max strength',
    description:
      'Strength of the real images during interpolation. Setting this to 1.0 will exactly reproduce the init imgs at some point in the video, but also causes a slight flicker',
    default: 0.95,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },

]

export default params;
