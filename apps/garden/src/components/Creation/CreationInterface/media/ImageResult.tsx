import ImageLoadingPlaceholder from '@/components/Creation/CreationInterface/media/ImageLoadingPlaceholder'
import Image from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'

const ImageResult = ({
  previewSizeUrl,
  aspectRatio,
  onLoad,
  priority,
  sizes,
}: {
  previewSizeUrl: string
  aspectRatio: number
  onLoad?: () => void
  priority?: boolean
  sizes?: string
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
  }, [previewSizeUrl, previewImageRef?.current, isLoaded])

  return (
    <div className={`w-full h-full`}>
      <div
        className={`relative w-full h-full rounded-lg overflow-hidden inline-flex`}
        style={{ paddingTop: `${aspectRatio}%` }}
      >
        <Image
          src={previewSizeUrl}
          alt={previewSizeUrl}
          fill={true}
          placeholder="empty"
          sizes={
            sizes || '(max-width: 768px) 100vw, (max-width: 895px) 33vw, 20vw'
          }
          style={{
            maxWidth: '100%',
            zIndex: 1,
            objectFit: 'contain',
            borderRadius: '8px',
          }}
          onLoad={handleOnLoad}
          priority={priority}
        />
        {!isLoaded && (
          <div className="absolute inset-0 text-gray-500">
            <ImageLoadingPlaceholder />
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageResult
