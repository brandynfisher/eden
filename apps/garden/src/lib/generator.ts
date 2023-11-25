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

export const conceptGenerator = {
  name: 'sdxl-lora-trainer',
  displayName: 'concept-trainer',
  description:
    'Create concept fine-tunings (also known as LoRA) that you can use for your creations.',
}

export const parameterGroups = [
  {
    name: 'concept',
    items: ['concept_id', 'concept_scale'],
    extraValidations: [
      //@todo: config like "if concept is active, verify that the <concept> token was used somewhere in the prompt and notify user"
    ],
  },
  {
    name: 'init_image',
    items: ['init_image', 'init_image_strength', 'adopt_aspect_ratio'],
  },
]
