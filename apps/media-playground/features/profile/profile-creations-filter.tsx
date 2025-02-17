import { BaseFilter, FilterSection } from '@/components/filter/base-filter'
import { profilePrivacyFilterSections } from '@/features/profile/profile-shared-privacy-filter'
import { FeedCursorRouteQueryParams } from '@edenlabs/eden-sdk'
import { AudioLinesIcon, ImageIcon, VideoIcon } from 'lucide-react'

const profileCreationSections: FilterSection[] = [
  profilePrivacyFilterSections,
  {
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
  },
  {
    id: 'tool' as keyof FeedCursorRouteQueryParams['filter'],
    label: 'Tool',
    items: [
      { id: 'flux_dev', name: 'Flux DEV' },
      { id: 'flux_schnell', name: 'Flux Schnell' },
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
  },
]

interface ProfileCreationsFilterProps {
  onChange: (filter: FeedCursorRouteQueryParams['filter']) => void
  initialFilter?: FeedCursorRouteQueryParams['filter']
}

export function ProfileCreationsFilter({
  onChange,
  initialFilter,
}: ProfileCreationsFilterProps) {
  return (
    <BaseFilter
      sections={profileCreationSections}
      onChange={onChange}
      initialFilter={initialFilter}
    />
  )
}
