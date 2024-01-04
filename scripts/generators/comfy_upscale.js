const params = [

  {
    name: 'mode',
    label: 'mode',
    description: 'mode',
    default: 'comfy_upscale',
    allowedValues: ["comfy_upscale"],
    isRequired: true,
  },

  {
    name: 'init_image',
    label: 'Image to animate',
    description:
      'The image you want to upscale',
    default: null,
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: true,
  },

  {
    name: 'denoise_strength',
    label: 'Creativity strength',
    description: 'High values (0.4-0.7) will give the upscale more freedom to invent new details, low values (0.2-0.3) will keep the upscale closer to the original image',
    default: 0.4,
    minimum: 0.1,
    maximum: 1.0,
    step: 0.05,
  },

  {
    name: 'width',
    label: 'Width',
    description: 'Max width of the creation in pixels',
    default: 1600,
    minimum: 1024,
    maximum: 2048,
    step: 64,
  },
  {
    name: 'height',
    label: 'Height',
    description: 'Max height of the creation in pixels',
    default: 1600,
    minimum: 1024,
    maximum: 2048,
    step: 64,
  },
  

]

export default params;
