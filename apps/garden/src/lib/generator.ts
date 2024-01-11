import { Generator, GeneratorParameter } from '@edenlabs/eden-sdk'

export const hiddenGenerators = [
  'complete',
  'tts',
  'tts_fast',
  'sdxl-lora-trainer',
  'interrogate',
  'wav2lip',
  'makeitrad',

  'txt2vid',
  'img2vid',
  'vid2vid',
]

export type GeneratorOutputType = 'image' | 'text' | 'video'

export const conceptGenerator = {
  name: 'sdxl-lora-trainer',
  displayName: 'concept-trainer',
  description:
    'Create concept fine-tunings (also known as LoRA) that you can use for your creations.',
}

export const sdxl_generators_image = [
  'create',
  'remix',
  'blend',
  'upscale',
  'controlnet',
  'makeitrad',
]
export const sdxl_generators_video = [
  'real2real',
  'real2real_audio',
  'interpolate',
  'dialogue',
  'monologue',
  'wav2lip',
]

export const parameterGroups: { [key: string]: string[] } = {
  concept: ['lora', 'lora_scale'],
  character: ['characterId'],
  characters: ['characterIds'],
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

export const getDefaultGeneratorVersion = (generator: Generator) =>
  generator.versions.filter(v => v.versionId == generator.defaultVersionId)[0]
