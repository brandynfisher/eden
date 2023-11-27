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

export type GeneratorOutputType = 'image' | 'text' | 'video'

export const sdxl_generators_image = [
  'create',
  'remix',
  'blend',
  'upscale',
  'controlnet',
]
export const sdxl_generators_video = [
  'real2real',
  'animatediff_comfyui',
  'interpolate',
  'dialogue',
  'monologue',
  'wav2lip',
]

export const parameterGroups: { [key: string]: string[] } = {
  concept: ['lora', 'lora_scale'],
  init_image: [
    'init_image',
    'init_image_strength',
    'adopt_aspect_from_init_img',
  ],
}

export const supportsGroup = (
  parameters: GeneratorParameter[],
  group: keyof typeof parameterGroups,
) => {
  return parameters.some((p: GeneratorParameter) => {
    return parameterGroups[group]?.includes(p.name)
  })
}
