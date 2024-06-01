import CdnImage from '@/components/Media/cdn-image'
import { AssetType } from '@/components/Media/lib/cloudinary'
import { ReactNode, useState } from 'react'

export const ResponsiveImage = ({
  src,
  alt,
  aspectRatio,
  sizes,
  priority,
  loading,
  children,
  onLoadingComplete,
  quality,
  className,
  assetType,
  onClick,
}: {
  src: string
  alt: string
  aspectRatio: number
  sizes?: string
  priority?: boolean
  loading?: 'lazy'
  children?: ReactNode
  onLoadingComplete?: () => void
  quality?: number
  className?: string
  assetType?: AssetType
  onClick?: () => void
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const handleOnLoadingComplete = () => {
    setIsLoaded(true)
    onLoadingComplete && onLoadingComplete()
  }

  return (
    <div
      onClick={() => onClick && onClick()}
      className={`relative ${
        !isLoaded ? 'bg-gray-100 dark:bg-gray-800' : ''
      } rounded-lg w-auto h-full ${className ? className : ''}`}
      style={{ aspectRatio: aspectRatio || 1 }}
    >
      <CdnImage
        src={src}
        alt={alt}
        sizes={sizes}
        width={0}
        height={0}
        quality={quality}
        priority={priority}
        loading={loading}
        onLoad={handleOnLoadingComplete}
        className={`h-full w-full object-contain ${className ? className : ''}`}
        assetType={assetType}
      />
      {children}
    </div>
  )
}
