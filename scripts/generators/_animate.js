const params = [
  {
    name: 'n_frames',
    label: 'Frames',
    description: 'Number of frames in the video',
    default: 60,
    minimum: 5,
    maximum: 600,
  },
  {
    name: 'loop',
    label: 'Loop',
    description: 'Loop the output video',
    default: true,
    allowedValues: [false, true],
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
    name: 'n_film',
    label: 'FILM Iterations',
    description:
      'Optionally apply FILM postprocessing to the generated frames to create a smoother video',
    default: 1,
    allowedValues: [0, 1],
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
  // {
  //   name: 'scale_modulation',
  //   label: 'Scale Modulation',
  //   description:
  //     'How much to scale down the guidance scale of the prompt conditioning in between keyframes',
  //   default: 0.0,
  //   minimum: 0.0,
  //   maximum: 0.25,
  //   step: 0.01,
  //   optional: true,
  // },
]

export default params;
