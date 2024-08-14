import LoadingIndicator from '@/components/loading-indicator'
import VideoResult from '@/components/media/video-result'
import { CreationV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'
import { PhotoProvider, PhotoView } from 'react-photo-view'

type Props = {
  creation: CreationV2
}

const CreationMediaPreview = ({ creation }: Props) => {
  return (
    <div
      className="relative flex items-center justify-center border-transparent bg-popover max-w-full max-h-[calc(100dvh_-_38px_-_64px)] rounded-lg overflow-hidden"
      style={{ aspectRatio: creation?.mediaAttributes?.aspectRatio || 1 }}
    >
      <PhotoProvider loadingElement={<LoadingIndicator />}>
        <PhotoView src={creation.url}>
          <Image
            src={creation.thumbnail || ''}
            alt={creation.thumbnail || ''}
            width={creation.mediaAttributes?.width || 1024}
            height={creation.mediaAttributes?.height || 1024}
            className="object-contain w-full max-h-full cursor-zoom-in"
          />
        </PhotoView>
      </PhotoProvider>

      {creation.mediaAttributes?.type === 'video' ? (
        <div className="absolute inset-0">
          <VideoResult
            width={creation.mediaAttributes?.width}
            height={creation.mediaAttributes?.height}
            videoUrl={creation.url || ''}
            posterUrl={creation.thumbnail}
            autoPlay={true}
            loop={true}
            controls={true}
            muted={false}
          />
        </div>
      ) : null}
    </div>
  )
}

export default CreationMediaPreview
