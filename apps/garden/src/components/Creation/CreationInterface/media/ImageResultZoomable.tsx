import ImageLoadingPlaceholder from '@/components/Creation/CreationInterface/media/ImageLoadingPlaceholder'
import ImagePreviewMask from '@/components/Creation/CreationInterface/media/ImagePreviewMask'
import { LoadingOutlined } from '@ant-design/icons'
import Image from 'next/image'
import React, { ReactNode, useCallback, useRef, useState } from 'react'

const ImagePlaceholder = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className="absolute inset-0 z-10">
      <Image
        src={imageUrl}
        alt={''}
        width="0"
        height="0"
        className="w-full h-auto object-contain absolute z-10 inset-0"
        sizes={'(max-width: 768px) 100vw, (max-width: 895px) 33vw, 20vw'}
        style={{ objectFit: 'contain', objectPosition: 'center' }}
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [adjustedAspectRatio, setAdjustedAspectRatio] = useState(aspectRatio)

  const handleOnLoad = useCallback(() => {
    if (containerRef.current) {
      console.log({
        offsetHeight: containerRef.current.offsetHeight,
        offsetWidth: containerRef.current.offsetWidth,
        aspectRatio,
      })
      const containerHeight = containerRef.current.offsetHeight
      const imageHeight = (containerRef.current.offsetWidth * aspectRatio) / 100
      if (imageHeight > containerHeight) {
        const newAspectRatio =
          (containerHeight / containerRef.current.offsetWidth) * 100
        // aspectRatio = newAspectRatio
        setAdjustedAspectRatio(newAspectRatio)
      }
      console.log(containerHeight, imageHeight, aspectRatio)
    }

    if (!isLoaded) {
      // console.log('-- set', true, previewSizeUrl.slice(50))
      setIsLoaded(true)
      // }
    } else {
      // console.log('-- set', false, previewSizeUrl.slice(50))
      setIsLoaded(false)
    }

    if (onLoad) {
      onLoad()
    }
  }, [isLoaded, onLoad, previewSizeUrl, containerRef, aspectRatio])

  return (
    <div
      key={previewSizeUrl}
      ref={containerRef}
      className={`image-zoomable-wrap relative w-full h-full overflow-hidden rounded-lg max-h-[80vh]`}
      style={{ paddingTop: `${adjustedAspectRatio}%` }}
    >
      {!isLoaded ? (
        <div className="absolute inset-0 text-gray-500 opacity-80">
          <ImageLoadingPlaceholder />
        </div>
      ) : null}
      {thumbnailSizeUrl ? (
        <ImagePlaceholder imageUrl={thumbnailSizeUrl} />
      ) : null}
      {previewSizeUrl ? (
        <div className="absolute inset-0">
          <Image
            src={previewSizeUrl}
            alt={previewSizeUrl}
            sizes={'(max-width: 1024px) 100vw, 50vw'}
            onLoadingComplete={handleOnLoad}
            priority={priority}
            width="0"
            height="0"
            className="w-full h-full object-contain absolute z-10 inset-0"
            style={{ objectFit: 'contain', objectPosition: 'center' }}
          />
        </div>
      ) : null}
      {children ? children : null}
      {fullSizeUrl && !showPreview && <ImagePreviewMask />}
    </div>
  )
}

export default ImageResultZoomable
