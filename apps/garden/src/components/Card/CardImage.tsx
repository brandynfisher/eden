import { ResponsiveImage } from '@/components/Media/ResponsiveImage'

const CardImage = ({
  uri,
  width,
  height,
  priority,
  sizes,
}: {
  uri: string
  width: number
  height: number
  priority?: boolean
  sizes?: string
}) => {
  return (
    <ResponsiveImage
      src={uri}
      alt={uri}
      aspectRatio={width / height}
      sizes={sizes || '(max-width: 768px) 90vw, (max-width: 1280px) 25vw, 12vw'}
      priority={priority}
    />
  )
}
export default CardImage
