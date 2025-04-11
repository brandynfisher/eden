import { FilterSection } from '@/components/filter/base-filter'
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
    { id: 'flux_dev', name: 'Flux DEV' },
    { id: 'flux_schnell', name: 'Flux Schnell' },
    { id: 'kling_pro', name: 'Kling Pro' },
    { id: 'upscaler', name: 'Upscaler' },
    { id: 'txt2img', name: 'txt2img' },
    { id: 'txt2vid', name: 'txt2vid' },
    { id: 'img2vid', name: 'img2vid' },
    { id: 'texture_flow', name: 'Texture Flow' },
    { id: 'animate_3D', name: 'Animate 3D' },
    { id: 'runway', name: 'Runway' },
    { id: 'style_mixing', name: 'Style Mixing' },
    { id: 'style_transfer', name: 'Style Transfer' },
    { id: 'face_styler', name: 'Face Styler' },
  ],
  canHaveMultipleValues: true,
}

export const collectionFilterSection: FilterSection = {
  id: 'collection' as keyof FeedCursorRouteQueryParams['filter'],
  label: 'Collection',
  items: [
    {
      id: process.env.NEXT_PUBLIC_EDEN_FEATURED_COLLECTION_ID || '',
      name: 'Featured',
      icon: <StarIcon className="h-4 w-4" />,
    },
  ],
  canHaveMultipleValues: false,
}
