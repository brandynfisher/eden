'use client'

import { MediaDurationBadge } from '@/components/badge/media-duration-badge'
import ActionsDropdown from '@/components/button/actions-dropdown'
import LikeButton from '@/components/button/like-button'
import CardFooter from '@/components/card/components/card-footer'
import CardImage from '@/components/card/components/card-image'
import VideoResult from '@/components/media/video-result'
import { Card } from '@/components/ui/card'
import { useHover } from '@/hooks/use-hover'
import { getCloudfrontUrl } from '@/lib/media'
import { FileType } from '@/types/Media'
import { CreationV2, Creator } from '@edenlabs/eden-sdk'
import { AudioLinesIcon } from 'lucide-react'
import Link from 'next/link'
import React, { CSSProperties, useState } from 'react'

type Props = {
  creation: CreationV2
  linkHref: string
  creator?: Creator
  showFooter?: boolean
  style?: CSSProperties
  onUpdate?: (item: CreationV2) => void
}

const CreationCard = ({ creation, showFooter, style }: Props) => {
  const { hovered, ref } = useHover()
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false)

  return (
    <Card
      ref={ref}
      className="overflow-hidden border-0 z-10 transition-shadow hover:shadow-[0_0px_8px_0_#030712,0_0px_3px_-1px_#030712]"
      style={style}
    >
      <Link
        href={`/creations/${creation._id}`}
        prefetch={false}
        className="relative w-full block"
      >
        {creation.mediaAttributes?.type === 'audio' ? (
          <div className="flex items-center justify-center h-32">
            <MediaDurationBadge
              duration={creation.mediaAttributes.duration}
              isLoading={false}
            />
            <AudioLinesIcon className="h-12 w-12" />
          </div>
        ) : (
          <CardImage
            media={{
              url: creation.url,
              thumbnail: creation.thumbnail,
              width: creation.mediaAttributes?.width,
              height: creation.mediaAttributes?.height,
              type: creation.mediaAttributes?.type as FileType,
            }}
          />
        )}

        {creation.mediaAttributes?.type === 'video' ? (
          <>
            <MediaDurationBadge
              duration={creation.mediaAttributes.duration}
              isLoading={hovered && !hasStartedPlayback}
            />
            {hovered ? (
              <VideoResult
                className="absolute inset-0 pointer-events-none"
                videoUrl={getCloudfrontUrl(creation.url) || ''}
                width={creation.mediaAttributes.width}
                height={creation.mediaAttributes.height}
                posterUrl={getCloudfrontUrl(creation.thumbnail)}
                muted={true}
                loop={true}
                autoPlay={true}
                controls={false}
                onPlay={() => setHasStartedPlayback(true)}
              />
            ) : null}
          </>
        ) : null}
      </Link>
      {showFooter ? (
        <CardFooter
          // creator={creator}
          actions={[
            <LikeButton
              key={0}
              count={4}
              isActive={false}
              onChange={() => null}
            />,
            <ActionsDropdown key={1} />,
          ]}
        />
      ) : null}
    </Card>
  )
}

export default CreationCard
