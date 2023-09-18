import ImageLoadingPlaceholder from '@/components/Creation/CreationInterface/media/ImageLoadingPlaceholder'
import ImagePreviewMask from '@/components/Creation/CreationInterface/media/ImagePreviewMask'
import Image from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const ImageResultZoomable = ({
  fullSizeUrl,
  previewSizeUrl,
  aspectRatio,
  showPreview,
  onLoad,
  priority,
}: {
  fullSizeUrl?: string
  previewSizeUrl: string
  aspectRatio: number
  showPreview?: boolean
  onLoad?: () => void
  priority?: boolean
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const previewImageRef = useRef<HTMLImageElement>(null)

  const handleOnLoad = useCallback(() => {
    if (!isLoaded) {
      setIsLoaded(true)
    }

    if (onLoad) {
      onLoad()
    }
  }, [isLoaded, onLoad])

  // trigger image onLoad if the image is complete
  useEffect(() => {
    if (!isLoaded && previewImageRef && previewImageRef?.current?.complete) {
      handleOnLoad()
    }
  }, [previewSizeUrl, fullSizeUrl, previewImageRef?.current, isLoaded])

  return (
    <div
      className={`image-zoomable-wrap relative w-full overflow-hidden rounded-lg h-full ${
        isLoaded ? '!pt-0 md:min-h-[75vh]' : ''
      }`}
      style={{ paddingTop: `${aspectRatio}%` }}
    >
      <Image
        src={previewSizeUrl}
        alt={previewSizeUrl}
        fill={true}
        placeholder="empty"
        // sizes={'(max-width: 768px) 100vw, (max-width: 895px) 33vw, 25vw'}
        onLoad={handleOnLoad}
        className="!relative max-w-full z-10 object-contain object-top max-h-[75vh] lg:!absolute"
        priority={priority}
      />
      {!isLoaded && (
        <div className="absolute inset-0 text-gray-500">
          <ImageLoadingPlaceholder />
        </div>
      )}
      {fullSizeUrl && !showPreview && <ImagePreviewMask />}
    </div>
  )
}

export default ImageResultZoomable
