const params = [
  {
    name: 'face_url',
    label: 'Face image file',
    description: 'Image containing face to be avatar',
    default: null,
    mediaUpload: 'image/png, image/jpeg, image/webp',
    isRequired: true,
  },
  {
    name: 'speech_url',
    label: 'Audio file',
    description: 'Audio of speech to be lip-synced',
    default: null,
    mediaUpload: 'audio/webm, audio/mp3, audio/wav',
    isRequired: true,
  },
  {
    name: 'gfpgan',
    label: 'GFPGAN',
    description:
      'Apply GFPGAN to improve face image quality from Wav2Lip (recommended)',
    default: true,
    allowedValues: [false, true],
    optional: true,
  },
  {
    name: 'gfpgan_upscale',
    label: 'Upscale',
    description: 'Upsampling factor (only used if GFPGAN is enabled)',
    default: 1.0,
    allowedValues: [1.0, 2.0],
    optional: true,
  },
  {
    name: 'intro_text',
    label: 'Intro text',
    description: 'Add introductory text to wav2lip video (optional)',
    default: null,
    optional: true,
  },
  {
    name: 'width',
    label: 'Force Width',
    description: 'Override width of output video (if left blank, will be same as Face image file',
    minimum: 128,
    maximum: 2048,
    optional: true,
  },
  {
    name: 'height',
    label: 'Force Height',
    description: 'Override height of output video (if left blank, will be same as Face image file',
    minimum: 128,
    maximum: 2048,
    optional: true,
  },
]

export default params;