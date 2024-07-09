import { GeneratorV2 } from '@edenlabs/eden-sdk'

const imageGenerators: GeneratorV2[] = [
  {
    name: 'txt2img',
    title: 'Text to Image',
    description: 'Generate images with text prompts',
    outputType: 'image',
    parameters: [],
  },
  {
    name: 'img2img',
    title: 'Image to Image',
    description: 'Generate images with image prompts',
    outputType: 'image',
    parameters: [],
  },
  {
    name: 'img2img',
    title: 'Image to Image',
    description: 'Generate images with image prompts',
    outputType: 'image',
    parameters: [],
  },
]

const videoGenerators: GeneratorV2[] = [
  {
    name: 'txt2vid',
    title: 'Text to Video',
    description: 'Generate videos with text prompts',
    outputType: 'video',
    parameters: [],
  },
  {
    name: 'img2vid',
    title: 'Image to Video',
    description: 'Generate videos with image prompts',
    outputType: 'video',
    parameters: [],
  },
  {
    name: 'vid2vid',
    title: 'Video to Video',
    description: 'Change the style of a video with images',
    outputType: 'video',
    parameters: [],
  },
]

export const generators = {
  image: imageGenerators,
  video: videoGenerators,
}
