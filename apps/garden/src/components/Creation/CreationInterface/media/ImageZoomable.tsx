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
  const hideMediaViewer = () => {
    console.log('hidemediaviewer')
    setShowZoomedView(false)
  }

  const showMediaViewer = () => {
    console.log('showMediaViewer')
    setShowZoomedView(true)
  }
  console.log({ url, showZoomedView })

  return (
    <div className="flex">
      <div
        className="cursor-pointer overflow-hidden rounded-lg  hover:scale-105 hover:brightness-110 transition-all"
        onClick={showMediaViewer}
      >
        <Image
          src={url}
          alt={url}
          width={width}
          height={height}
          className="object-contain z-10"
        />
      </div>
      {showZoomedView ? (
        <ImageZoomPan imageUrl={url} onCloseHandler={hideMediaViewer} />
      ) : null}
    </div>
  )
}

export default ImageZoomable
