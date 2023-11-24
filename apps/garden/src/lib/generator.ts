import { GeneratorParameter } from '@edenlabs/eden-sdk'

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

// export const parameterGroups = [
//   {
//     name: 'concept',
//     items: ['lora', 'lora_scale'],
//   },
//   {
//     name: 'init_image',
//     items: ['init_image', 'init_image_strength', 'adopt_aspect_ratio'],
//   },
// ]

export const parameterGroups: { [key: string]: string[] } = {
  concept: ['lora', 'lora_scale'],
  init_image: ['init_image', 'init_image_strength', 'adopt_aspect_ratio'],
}

export const supportsGroup = (
  parameters: GeneratorParameter[],
  group: keyof typeof parameterGroups,
) => {
  return parameters.some((p: GeneratorParameter) => {
    return parameterGroups[group]?.includes(p.name)
  })
}
