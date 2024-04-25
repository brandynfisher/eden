import ImageLoadingPlaceholder from '@/components/Creation/CreationInterface/media/ImageLoadingPlaceholder'
import ImageZoomPan from '@/components/Creation/CreationInterface/media/ImageZoomPan'
import Image from 'next/image'
import React, { useState } from 'react'

const ImageZoomable = ({
  url,
  width,
  height,
}: {
  url: string
  width: number
  height: number
}) => {
  const [showZoomedView, setShowZoomedView] = useState(false)
  const [showPlaceholder, setShowPlaceholder] = useState(true)

  const hideMediaViewer = () => {
    // console.log('hidemediaviewer')
    setShowZoomedView(false)
  }

  const showMediaViewer = () => {
    // console.log('showMediaViewer')
    setShowZoomedView(true)
  }
  // console.log({ url, showZoomedView })

  const hidePlaceholder = () => {
    setShowPlaceholder(false)
  }

  return (
    <div className="flex">
      <div
        className="relative cursor-pointer overflow-hidden rounded-lg  hover:scale-105 hover:brightness-110 transition-all"
        onClick={showMediaViewer}
      >
        {showPlaceholder ? (
          <div className="absolute w-full h-full z-0">
            <ImageLoadingPlaceholder />
          </div>
        ) : null}

        <Image
          src={url}
          alt={url}
          width={width}
          height={height}
          onLoad={hidePlaceholder}
          className="object-contain relative z-10"
        />
      </div>
      {showZoomedView ? (
        <ImageZoomPan imageUrl={url} onCloseHandler={hideMediaViewer} />
      ) : null}
    </div>
  )
}

export default ImageZoomable
