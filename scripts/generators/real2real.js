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
    default: 960,
    minimum: 512,
    maximum: 1280,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'real2real uses [Width x Height] total number of pixels and adopts the average aspect ratio of your provided images',
    default: 960,
    minimum: 512,
    maximum: 1280,
    step: 64,
  },
  {
    name: 'n_frames',
    label: 'Frames',
    description: 'Total number of frames in the video (increase when you use many images)',
    default: 60,
    minimum: 10,
    maximum: 400,
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
      '(optional) activate a trained concept',
    optional: true,
  },
  {
    name: 'lora_scale',
    label: 'Concept strength',
    description:
      'How strongly to activate the concept. Lower this value if output looks too similar to your training images',
    default: 0.7,
    minimum: 0.0,
    maximum: 1.2,
    step: 0.02,
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
    description: 'what you DONT want to see',
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
    name: 'sampler',
    label: 'Sampler',
    description: 'Sampler to use for generation (Euler highly recommended)',
    default: 'euler',
    allowedValues: ["ddim", "ddpm", "klms", "euler"],
    optional: true,
  },
  {
    name: 'steps',
    label: 'Steps',
    description: 'Number of denoising steps (recommended to use >30)',
    default: 30,
    minimum: 5,
    maximum: 50,
    optional: true,
  },

  {
    name: 'smooth',
    label: 'Smooth',
    description:
      'Use visual smoothing algorithm (highly recommended), turning this off leads to a very different aesthetic with more frame flicker',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  
  {
    name: 'n_film',
    label: 'FILM Iterations',
    description:
      'Number of iterations to apply FILM postprocessing (frame smoothing) to create a smoother video (1 = highly recommended)',
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
    minLength: 2,
    maxLength: 8,
  },
  {
    name: 'interpolation_init_images_min_strength',
    label: 'Fading smoothness',
    description:
      'Low values will result in a rich visual journey, higher values will look more like alpha-fading but will also be smoother. Values above 0.4 are almost never needed',
    default: 0.05,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },
  {
    name: 'interpolation_init_images_max_strength',
    label: 'Keyframe strength',
    description:
      'Strength of the real images during interpolation. Setting this to 1.0 will exactly reproduce the init imgs at some point in the video, lower values will allow the video to drift away from your uploaded images',
    default: 0.8,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },

]

export default params;
