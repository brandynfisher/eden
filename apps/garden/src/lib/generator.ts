import { Generator, GeneratorParameter } from '@edenlabs/eden-sdk'

export const hiddenGenerators = [
  'complete',
  'tts',
  'tts_fast',
  'sdxl-lora-trainer',
  'interrogate',
  // 'monologue',
  // 'dialogue',
  'wav2lip',
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
  'comfy_upscale',
  'comfy_makeitrad',
]
export const sdxl_generators_video = [
  'real2real',
  'animatediff_comfyui',
  'interpolate',
  'dialogue',
  'monologue',
  'wav2lip',
  'comfy_txt2vid',
  'comfy_img2vid',
  'comfy_vid2vid',
]

export const parameterGroups: { [key: string]: string[] } = {
  concept: ['lora', 'lora_scale'],
  character: ['characterId'],
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
