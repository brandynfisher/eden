const params = [

  {
    name: 'render_mode',
    label: 'Animation mode',
    description: 'text-to-video or video-to-video (style transfer)',
    default: 'txt2vid',
    allowedValues: ["txt2vid", "vid2vid"],
  },
  
  {
    name: 'input_video_path',
    label: 'input video (only used by vid2vid mode)',
    description: 'Source video (driving shape/content)',
    default: null,
    isRequired: true,
    mediaUpload: "video/mp4, image/gif",
  },
  
  {
    name: 'prompt',
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
  
  {
    name: 'n_frames',
    label: 'Number of frames',
    description: 'length of the output video',
    default: 48,
    minimum: 16,
    maximum: 320,
  },
  
  {
    name: 'controlnet_type',
    label: 'ControlNet mode',
    description: 'Which ControlNet mode to use for vid2vid mode (we recommend canny-edge or luminance)',
    default: 'qr_monster',
    allowedValues: ["qr_monster", "canny-edge"],
  },

  {
    name: 'controlnet_strength',
    label: 'Control video strength',
    description:
      'How much influence the guidance video has on the creation. Recommended >0.5',
    default: 0.6,
    minimum: 0.0,
    maximum: 1.25,
    step: 0.01,
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
