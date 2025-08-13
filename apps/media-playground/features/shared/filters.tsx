import { FilterSection } from '@/components/filter/base-filter'
import { env } from '@/lib/config'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { AudioLinesIcon, ImageIcon, StarIcon, VideoIcon } from 'lucide-react'

export const outputTypeFilterSection: FilterSection = {
  id: 'output_type' as keyof FeedCursorRouteQueryParams['filter'],
  label: 'Type',
  items: [
    {
      id: 'image',
      name: 'Image',
      icon: <ImageIcon className="h-4 w-4" />,
    },
    {
      id: 'video',
      name: 'Video',
      icon: <VideoIcon className="h-4 w-4" />,
    },
    {
      id: 'audio',
      name: 'Audio',
      icon: <AudioLinesIcon className="h-4 w-4" />,
    },
  ],
  canHaveMultipleValues: true,
}

export const toolFilterSection: FilterSection = {
  id: 'tool' as keyof FeedCursorRouteQueryParams['filter'],
  label: 'Tool',
  items: [
    { id: 'flux_dev', name: 'Flux-Dev' },
    { id: 'flux_schnell', name: 'Flux-Schnell' },
    { id: 'flux_double_character', name: 'Combine Characters' },
    { id: 'flux_inpainting', name: 'Inpaint' },
    { id: 'outpaint', name: 'Outpaint' },
    { id: 'flux_kontext', name: 'Flux Kontext' },
    { id: 'txt2img', name: 'txt2img' },
    { id: 'openai_image_generate', name: 'OpenAI Image Generate' },
    { id: 'openai_image_edit', name: 'OpenAI Image Edit' },

    { id: 'reel', name: 'Reel' },
    { id: 'texture_flow', name: 'Texture Flow' },
    { id: 'video_FX', name: 'Video FX' },
    { id: 'kling_pro', name: 'Kling ' },
    { id: 'runway', name: 'Runway' },
    { id: 'veo2', name: 'Veo-2' },
    { id: 'veo3', name: 'Veo-3' },
    { id: 'hedra', name: 'Hedra' },

    { id: 'txt2vid', name: 'Text-to-Video' },
    { id: 'img2vid', name: 'Image-to-Video' },
    { id: 'animate_3D', name: 'Animate 3D' },
    { id: 'style_mixing', name: 'Style Mixing' },
    { id: 'style_transfer', name: 'Style Transfer' },
    { id: 'face_styler', name: 'Face Styler' },
    { id: 'face_swap', name: 'Face Swap' },
    { id: 'legacy_real2real', name: 'Real2Real' },
    { id: 'legacy_interpolate', name: 'Interpolate' },
    { id: 'legacy_txt2vid', name: 'Text-to-Video (legacy)' },
    { id: 'legacy_img2vid', name: 'Image-to-Video (legacy)' },

    { id: 'thinksound', name: 'Thinksound' },
    { id: 'musicgen', name: 'MusicGen' },
    { id: 'elevenlabs', name: 'Elevenlabs' },
  ],
  canHaveMultipleValues: true,
}

export const collectionFilterSection: FilterSection = {
  id: 'collection' as keyof FeedCursorRouteQueryParams['filter'],
  label: 'Collection',
  items: [
    {
      id: env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID || '',
      name: 'Featured',
      icon: <StarIcon className="h-4 w-4" />,
    },
  ],
  canHaveMultipleValues: false,
}
