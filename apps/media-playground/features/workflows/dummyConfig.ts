export type WorkflowOutputType = 'video' | 'image' | 'model' | 'text' | 'audio'

export interface Workflow {
  _id: string
  title: string
  description?: string
  link: string
  image: string
  outputType: WorkflowOutputType
}

const imageWorkflows: Workflow[] = [
  {
    _id: 'txt2img',
    title: 'Text to Image',
    description: 'Generate images with text prompts',
    link: '/create/image/txt2img',
    image: '/images/workflows/model-training-concept.jpeg',
    outputType: 'image',
  },
  {
    _id: 'img2img',
    title: 'Image to Image',
    description: 'Generate images with image prompts',
    link: '/create/image/img2img',
    image: '/images/workflows/model-training-concept.jpeg',
    outputType: 'image',
  },
]

const videoWorkflows: Workflow[] = [
  {
    _id: 'txt2vid',
    title: 'Text to Video',
    link: '/create/video/txt2vid',
    description: 'Generate videos with text prompts',
    image: '/images/workflows/model-training-concept.jpeg',
    outputType: 'video',
  },
  {
    _id: 'img2vid',
    title: 'Image to Video',
    link: '/create/video/img2vid',
    description: 'Generate videos with image prompts',
    image: '/images/workflows/model-training-concept.jpeg',
    outputType: 'video',
  },
  {
    _id: 'vid2vid',
    title: 'Video to Video',
    description: 'Change the style of a video with images',
    link: '/create/video/vid2vid',
    image: '/images/workflows/model-training-concept.jpeg',
    outputType: 'video',
  },
]

export const workflows = {
  image: imageWorkflows,
  video: videoWorkflows,
}
