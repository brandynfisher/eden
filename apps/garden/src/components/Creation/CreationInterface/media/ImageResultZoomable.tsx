import ImageLoadingPlaceholder from '@/components/Creation/CreationInterface/media/ImageLoadingPlaceholder'
import ImagePreviewMask from '@/components/Creation/CreationInterface/media/ImagePreviewMask'
import { LoadingOutlined } from '@ant-design/icons'
import Image from 'next/image'
import React, { ReactNode, useCallback, useState } from 'react'

const ImagePlaceholder = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className="absolute inset-0 z-10">
      <Image
        src={imageUrl}
        alt={''}
        width="0"
        height="0"
        className="w-full h-full object-contain absolute z-10 inset-0"
        sizes={'(max-width: 768px) 100vw, (max-width: 895px) 33vw, 20vw'}
        style={{ objectFit: 'contain', objectPosition: 'top center' }}
      />
      <LoadingOutlined className="absolute text-2xl z-10 top-4 right-4 opacity-70 text-gray-700" />
    </div>
  )
}
const ImageResultZoomable = ({
  fullSizeUrl,
  previewSizeUrl,
  thumbnailSizeUrl,
  aspectRatio,
  showPreview,
  onLoad,
  priority,
  children,
}: {
  fullSizeUrl?: string
  previewSizeUrl?: string
  thumbnailSizeUrl?: string
  aspectRatio: number
  showPreview?: boolean
  onLoad?: () => void
  priority?: boolean
  children?: ReactNode
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  const handleOnLoad = useCallback(() => {
    // console.log('handleOnLoad')
    // if (!isLoaded) {
    setIsLoaded(true)
    // } else {
    // console.log('-- unload')
    // setIsLoaded(false)
    // }

    if (onLoad) {
      onLoad()
    }
  }, [onLoad, previewSizeUrl, setIsLoaded])

  return (
    <div
      className={`image-zoomable-wrap relative w-full h-full overflow-hidden rounded-lg`}
      style={{ paddingTop: `${aspectRatio}%` }}
    >
      {!isLoaded ? (
        <div className="absolute inset-0 text-gray-500 opacity-80">
          <ImageLoadingPlaceholder />
        </div>
      ) : null}
      {thumbnailSizeUrl ? (
        <ImagePlaceholder key={thumbnailSizeUrl} imageUrl={thumbnailSizeUrl} />
      ) : null}
      {previewSizeUrl ? (
        <div className="absolute inset-0">
          <Image
            key={previewSizeUrl}
            src={previewSizeUrl}
            alt={previewSizeUrl}
            sizes={'(max-width: 1024px) 100vw, 50vw'}
            onLoadingComplete={handleOnLoad}
            priority={priority}
            width="0"
            height="0"
            className="w-full h-full object-contain absolute z-10 inset-0"
            style={{ objectFit: 'contain', objectPosition: 'top center' }}
          />
        </div>
      ) : null}
      {children ? children : null}
      {fullSizeUrl && !showPreview && <ImagePreviewMask />}
    </div>
  )
}

export default ImageResultZoomable
