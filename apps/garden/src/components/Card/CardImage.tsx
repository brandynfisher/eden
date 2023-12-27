import { ResponsiveImage } from '@/components/Media/ResponsiveImage'

const CardImage = ({
  uri,
  width,
  height,
  priority,
  sizes,
  className,
}: {
  uri: string | undefined
  width: number
  height: number
  priority?: boolean
  sizes?: string
  className?: string
}) => {
  return (
    <ResponsiveImage
      src={uri ? uri : '/placeholder.png'}
      alt={uri ? uri : 'image placeholder'}
      aspectRatio={width / height}
      sizes={sizes || '(max-width: 768px) 90vw, (max-width: 1280px) 25vw, 12vw'}
      priority={priority}
      className={className}
    />
  )
}
export default CardImage
