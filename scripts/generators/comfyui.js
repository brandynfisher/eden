const params = [
    {
      name: 'input_prompt', //text_input
      label: 'Prompt',
      description: 'Text prompt for the creation',
      default: null,
      isRequired: true,
    },
    {
      name: 'negative_prompt', //uc_text
      label: 'Negative prompt',
      description: 'what you DONT want to see',
      default:
          'watermark, text, nude, naked, nsfw, poorly drawn face, ugly, tiling, out of frame, blurry, blurred, grainy, signature, cut off, draft',
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
  