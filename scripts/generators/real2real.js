import animateParameters from './_animate.js'
import baseParameters from './_base.js'

const params = [
  ...baseParameters,
  ...animateParameters,
  {
    name: 'interpolation_init_images',
    label: 'Real images',
    description: 'URLs of images to use as init images for real2real',
    default: [],
    mediaUpload: true,
    minLength: 2,
    maxLength: 8,
    isRequired: true,
  },
  {
    name: 'interpolation_init_images_power',
    label: 'Init image power',
    description:
      'Power of the init_img_strength curve (how fast init_img_strength declines at the keyframes)',
    default: 3.0,
    minimum: 0.5,
    maximum: 5.0,
    step: 0.01,
    optional: true,
  },
  {
    name: 'interpolation_init_images_min_strength',
    label: 'Init image min strength',
    description:
      'Min strength of the init_img during interpolation. Lower values will give the interpolation more freedom, leading to more visual changes at the cost of less smoothness',
    default: 0.25,
    minimum: 0.0,
    maximum: 1.0,
    step: 0.01,
    optional: true,
  },
  {
    name: 'interpolation_init_images_max_strength',
    label: 'Init image max strength',
    description:
      'Max strength of the init_img during interpolation. Setting this to 1.0 will exactly reproduce the init imgs at some point in the video, but also causes a slight flicker',
    default: 0.95,
    minimum: 0.0,
    maximum: 1.0,
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
    name: 'guidance_scale',
    label: 'Guidance scale',
    description: 'Strength of prompt conditioning guidance',
    default: 5.5,
    minimum: 0.0,
    maximum: 30.0,
    step: 0.1,
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
]

export default params;
