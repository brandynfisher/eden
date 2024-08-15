import { Media } from '@/types/Media'
import Image from 'next/image'

type Props = {
  media: Media
}

const CardImage = ({ media }: Props) => {
  // console.log(media)
  return (
    <Image
      src={media.thumbnail || (media.type === 'image' ? media.url : '') || ''}
      alt={'card media thumbnail'}
      width={media.width}
      height={media.height}
      data-loaded="false"
      onLoad={event => {
        event.currentTarget.setAttribute('data-loaded', 'true')
      }}
      className="data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 data-[loaded=false]:dark:bg-gray-500/10"
    />
  )
}

export default CardImage
