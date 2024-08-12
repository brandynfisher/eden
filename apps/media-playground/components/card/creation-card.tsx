import { VideoDurationBadge } from '@/components/badge/video-duration-badge'
import LikeButton from '@/components/button/like-button'
import ToolsButton from '@/components/button/tools-button'
import CardFooter from '@/components/card/components/card-footer'
import CardImage from '@/components/card/components/card-image'
import { Card } from '@/components/ui/card'
import { FileType } from '@/types/Media'
import { CreationV2, Creator } from '@edenlabs/eden-sdk'
import Link from 'next/link'
import { CSSProperties } from 'react'

type Props = {
  creation: CreationV2
  linkHref: string
  creator?: Creator
  showFooter?: boolean
  style?: CSSProperties
}

const CreationCard = ({ creation, creator, showFooter, style }: Props) => {
  return (
    <Card className="overflow-hidden border-0" style={style}>
      <Link
        href={`/creations/${creation._id}`}
        prefetch={false}
        className="relative w-full block"
      >
        <CardImage
          media={{
            url: creation.url,
            thumbnail: creation.thumbnail,
            width: creation.mediaAttributes?.width,
            height: creation.mediaAttributes?.height,
            type: creation.mediaAttributes?.type as FileType,
          }}
        />
        {creation.mediaAttributes?.type === 'video' ? (
          <VideoDurationBadge duration={creation.mediaAttributes.duration} />
        ) : null}
      </Link>
      {showFooter ? (
        <CardFooter
          creator={creator}
          actions={[
            <LikeButton
              key={0}
              count={4}
              isActive={false}
              onChange={() => null}
            />,
            <ToolsButton key={1} />,
          ]}
        />
      ) : null}
    </Card>
  )
}

export default CreationCard
