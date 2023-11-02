import ImageLoadingPlaceholder from '@/components/Creation/CreationInterface/media/ImageLoadingPlaceholder'
import ImagePreviewMask from '@/components/Creation/CreationInterface/media/ImagePreviewMask'
import LoadingOutlined from '@ant-design/icons/LoadingOutlined'
import Image from 'next/image'
import React, { ReactNode, useCallback, useState } from 'react'

const ImagePlaceholder = ({
  imageUrl,
  limitHeight,
}: {
  limitHeight?: boolean
  imageUrl: string
}) => {
  return (
    <div
      className={`absolute inset-0 z-10 ${limitHeight ? 'max-h-[80vh]' : ''}`}
    >
      <Image
        src={imageUrl}
        alt={''}
        width="0"
        height="0"
        className="w-full h-full object-contain absolute z-10 inset-0"
        sizes={'(max-width: 768px) 90vw, (max-width: 1280px) 25vw, 15vw'}
        style={{ objectFit: 'contain', objectPosition: 'top center' }}
      />
      <LoadingOutlined className="absolute text-2xl z-10 top-4 right-4 opacity-90 text-gray-400" />
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
  limitHeight = true,
  quality,
}: {
  fullSizeUrl?: string
  previewSizeUrl?: string
  thumbnailSizeUrl?: string
  aspectRatio: number
  showPreview?: boolean
  onLoad?: () => void
  priority?: boolean
  children?: ReactNode
  limitHeight?: boolean
  quality?: number
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  const handleOnLoad = useCallback(() => {
    // if (!isLoaded) {
    setIsLoaded(true)
    // } else {
    // console.log('-- unload')
    // setIsLoaded(false)
    // }

    if (onLoad) {
      onLoad()
    }
  }, [onLoad, thumbnailSizeUrl, previewSizeUrl, setIsLoaded])

  return (
    <div
      className={`image-zoomable-wrap relative w-full h-fit overflow-hidden rounded-lg`}
      style={{ paddingTop: `${aspectRatio}%` }}
    >
      {previewSizeUrl && !isLoaded ? (
        <div
          className={`absolute inset-0 text-gray-500 opacity-80 ${
            limitHeight ? 'max-h-[80vh]' : ''
          }`}
        >
          <ImageLoadingPlaceholder />
        </div>
      ) : null}
      {!isLoaded && thumbnailSizeUrl && previewSizeUrl ? (
        <ImagePlaceholder
          key={thumbnailSizeUrl}
          imageUrl={thumbnailSizeUrl}
          limitHeight={limitHeight}
        />
      ) : null}
      {previewSizeUrl ? (
        <div
          className={`absolute inset-0 ${limitHeight ? 'max-h-[80vh]' : ''}`}
        >
          <Image
            key={previewSizeUrl}
            src={previewSizeUrl}
            alt={previewSizeUrl}
            sizes={'(max-width: 1024px) 90vw, (max-width: 1280px) 50vw, 75vw'}
            onLoadingComplete={handleOnLoad}
            priority={priority}
            width="0"
            height="0"
            // loading={priority ? 'eager' : 'lazy'}
            className="w-full h-full object-contain absolute z-10 inset-0"
            style={{ objectFit: 'contain', objectPosition: 'top center' }}
            quality={quality}
          />
        </div>
      ) : null}
      {children ? children : null}
      {fullSizeUrl && !showPreview && (
        <ImagePreviewMask limitHeight={limitHeight} />
      )}
    </div>
  )
}

export default ImageResultZoomable
