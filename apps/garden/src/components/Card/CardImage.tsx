import { ResponsiveImage } from '@/components/Media/ResponsiveImage'
import { AssetType } from '@/components/Media/lib/cloudinary'

const CardImage = ({
  uri,
  width,
  height,
  priority,
  loading,
  sizes,
  className,
  assetType,
}: {
  uri: string | undefined
  width?: number
  height?: number
  priority?: boolean
  loading?: 'lazy'
  sizes?: string
  className?: string
  assetType?: AssetType
}) => {
  if (!uri) {
    return null
  }

  return (
    <ResponsiveImage
      assetType={assetType}
      src={uri}
      alt={uri}
      aspectRatio={width && height ? width / height : 1}
      sizes={sizes || '(max-width: 768px) 90vw, (max-width: 1280px) 25vw, 12vw'}
      priority={priority}
      loading={loading}
      className={`transition-transform duration-200 ease-in group-hover:scale-105 ${className}`}
    />
  )
}
export default CardImage
