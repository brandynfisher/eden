export const hiddenGenerators = [
  'complete',
  'tts',
  'tts_fast',
  'sdxl-lora-trainer',
  'interrogate',
  'monologue',
  'dialogue',
  'wav2lip',
]

export const parameterGroups = [
  {
    name: 'concept',
    items: ['concept_id', 'concept_scale'],
  },
  {
    name: 'init_image',
    items: ['init_image', 'init_image_strength', 'adopt_aspect_ratio'],
  },
]
