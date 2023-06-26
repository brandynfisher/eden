export default [
  {
    name: 'init_image_data',
    label: 'Image',
    description: 'URL of image to initiate image before diffusion (if null, use random noise)',
    default: null,
    mediaUpload: true,
    isRequired: true,
  },
]
