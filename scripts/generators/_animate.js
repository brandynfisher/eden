module.exports = [
  {
    name: 'n_frames',
    label: 'Frames',
    description: 'Number of frames in the video',
    default: 60,
    minimum: 3,
    maximum: 1000,
  },
  {
    name: 'loop',
    label: 'Loop',
    description: 'Loop the output video',
    default: false,
    allowedValues: [false, true],
  },
  {
    name: 'smooth',
    label: 'Smooth',
    description:
      'Optimize video for perceptual smoothness between frames (if false, frames are linearly spaced in prompt conditioning space)',
    default: true,
    //allowedValues: [false, true],
    allowedValues: [true],
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
    description: 'Frames per second of the output video',
    default: 12,
    minimum: 1,
    maximum: 60,
    optional: true,
  },
  {
    name: 'scale_modulation',
    label: 'Scale Modulation',
    description:
      'How much to scale down the guidance scale of the prompt conditioning in between keyframes',
    default: 0.0,
    minimum: 0.0,
    maximum: 0.25,
    step: 0.01,
    optional: true,
  },
]
