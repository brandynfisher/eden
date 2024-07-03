import CardFooter from '@/components/card/components/card-footer'
import CardHeader from '@/components/card/components/card-header'
import CardMedia from '@/components/card/components/card-media'
import { Card } from '@/components/ui/card'
import { Creator } from '@edenlabs/eden-sdk'

type Props = {
  creator: Creator
  linkHref: string
}
const ArtistCard = ({ creator }: Props) => {
  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader title={creator.username} />
      <CardMedia
        media={{
          uri: creator.userImage,
          thumbnailUri: creator.userImage,
          width: 512,
          height: 512,
          type: 'image',
        }}
        linkHref={`/creators/${creator.username}`}
      />
      <CardFooter />
    </Card>
  )
}

export default ArtistCard
