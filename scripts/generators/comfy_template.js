const params = [

  {
    name: 'input_video_path',
    label: 'input video (only used by vid2vid mode)',
    description: 'Source video (driving shape/content)',
    default: null,
    mediaUpload: "video/mp4, image/gif",
  },
  
  {
    name: 'text_input',
    label: 'Prompt',
    description: 'Text prompt for the creation',
    default: null,
    isRequired: true,
  },
  
  {
    name: 'width',
    label: 'Width',
    description: 'Width of the creation in pixels',
    default: 768,
    minimum: 512,
    maximum: 1536,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Height of the creation in pixels',
    default: 768,
    minimum: 512,
    maximum: 1536,
    step: 64,
  },
  

  ////////////////////////////////////////
  // optional generation args
  
  {
    name: 'negative_prompt',
    label: 'Negative prompt',
    description: 'what you DONT want to see',
    default:
      'watermark, text, nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, blurry, blurred, grainy, signature, cut off, draft',
    optional: true,
  },
  {
    name: 'guidance_scale',
    label: 'Guidance scale',
    description: 'Strength of the prompt (higher values usually increase saturation and constrast)',
    default: 7.0,
    minimum: 0.0,
    maximum: 20.0,
    step: 0.1,
    optional: true,
  },
  {
    name: 'steps',
    label: 'Steps',
    description: 'Number of denoising steps (recommended to use >30)',
    default: 30,
    minimum: 10,
    maximum: 60,
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
