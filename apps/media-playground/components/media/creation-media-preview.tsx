import TimelineItemVideo from '@/components/timeline/timeline-item-video'
import { CreationV2 } from '@edenlabs/eden-sdk'
import Image from 'next/image'
import React from 'react'

type Props = {
  creation: CreationV2
}

const CreationMediaPreview = ({ creation }: Props) => {
  return (
    <div
      className="relative flex items-center justify-center border-transparent bg-popover max-w-full max-h-[calc(100dvh_-_38px_-_64px)]"
      style={{ aspectRatio: creation?.mediaAttributes?.aspectRatio || 1 }}
    >
      {creation.url?.endsWith('.mp4') ? (
        <TimelineItemVideo
          width={creation.mediaAttributes?.width}
          height={creation.mediaAttributes?.height}
          videoUrl={creation.url}
          posterUrl={creation.thumbnail}
        />
      ) : (
        <Image
          src={creation.thumbnail || ''}
          alt={creation.thumbnail || ''}
          width={creation.mediaAttributes?.width || 1024}
          height={creation.mediaAttributes?.height || 1024}
          className="object-contain w-full max-h-full"
        />
      )}
    </div>
  )
}

export default CreationMediaPreview
