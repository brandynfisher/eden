import ImageLoadingPlaceholder from '@/components/Creation/CreationInterface/media/ImageLoadingPlaceholder'
import ImagePreviewMask from '@/components/Creation/CreationInterface/media/ImagePreviewMask'
import { LoadingOutlined } from '@ant-design/icons'
import Image from 'next/image'
import React, { useCallback, useState } from 'react'

const ImagePlaceholder = ({ imageUrl }: { imageUrl: string }) => {
  return (
    <div className="absolute inset-0">
      <Image
        src={imageUrl}
        alt={''}
        fill={true}
        placeholder="empty"
        // className="object-contain"
        // className={`z-10 object-contain`}
        className="w-full h-auto object-contain absolute z-10 inset-0"
        sizes={'(max-width: 768px) 100vw, (max-width: 895px) 33vw, 20vw'}
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
}: {
  fullSizeUrl?: string
  previewSizeUrl: string
  thumbnailSizeUrl?: string
  aspectRatio: number
  showPreview?: boolean
  onLoad?: () => void
  priority?: boolean
}) => {
  const [isLoaded, setIsLoaded] = useState(false)

  const handleOnLoad = useCallback(() => {
    console.log('handleOnLoad', previewSizeUrl.slice(50))

    if (!isLoaded) {
      console.log('-- set', true, previewSizeUrl.slice(50))
      setIsLoaded(true)
      // }
    } else {
      console.log('-- set', false, previewSizeUrl.slice(50))
      setIsLoaded(false)
    }

    if (onLoad) {
      onLoad()
    }
  }, [isLoaded, onLoad, previewSizeUrl])

  // useEffect(() => {
  //
  // }, [previewSizeUrl, thumbnailSizeUrl])

  return (
    <div
      key={previewSizeUrl}
      // className={`image-zoomable-wrap relative w-full overflow-hidden rounded-lg flex ${
      //   isLoaded ? '!pt-0 md:min-h-[75vh] max-h-[75vh]' : ''
      // }`}
      className={`image-zoomable-wrap relative w-full h-full overflow-hidden rounded-lg`}
      style={{ paddingTop: `${aspectRatio}%` }}
    >
      {!isLoaded ? (
        <div className="absolute inset-0 text-gray-500">
          <ImageLoadingPlaceholder />
        </div>
      ) : null}
      {!isLoaded && thumbnailSizeUrl ? (
        <ImagePlaceholder imageUrl={thumbnailSizeUrl} />
      ) : null}
      <Image
        src={previewSizeUrl}
        alt={previewSizeUrl}
        // fill={true}
        placeholder="empty"
        sizes={'(max-width: 1024px) 100vw, 50vw'}
        onLoadingComplete={handleOnLoad}
        // className={`${isLoaded ? '!relative' : ''} max-w-full max-h-[75vh] z-10 object-contain lg:!absolute`}
        // className={`z-10 object-contain`}
        // className="object-contain"
        priority={priority}
        width="0"
        height="0"
        // sizes="100vw"
        className="w-full h-auto object-contain absolute z-10 inset-0"
      />
      {fullSizeUrl && !showPreview && <ImagePreviewMask />}
    </div>
  )
}

export default ImageResultZoomable
