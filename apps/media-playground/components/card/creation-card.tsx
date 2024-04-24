import LikeButton from '@/components/button/like-button'
import ToolsButton from '@/components/button/tools-button'
import CardFooter from '@/components/card/components/card-footer'
import CardMedia from '@/components/card/components/card-media'
import { Card } from '@/components/ui/card'
import { Creation, Creator } from '@edenlabs/eden-sdk'

type Props = {
  creation: Creation
  linkHref: string
  creator?: Creator
  showFooter?: boolean
}

const CreationCard = ({ creation, creator, showFooter }: Props) => {
  return (
    <Card className="mb-4 overflow-hidden">
      <CardMedia
        media={{
          uri: creation.uri,
          thumbnailUri: creation.thumbnail,
          width: creation.mediaAttributes.width,
          height: creation.mediaAttributes.height,
        }}
        linkHref={`/creation/${creation._id}`}
      />
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
