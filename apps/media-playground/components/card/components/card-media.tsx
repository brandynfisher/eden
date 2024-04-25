import { Media } from '@/types/Media'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  media: Media
  linkHref: string
}

const CardMedia = ({ media, linkHref }: Props) => {
  return (
    <Link href={linkHref} className="relative w-full block">
      <Image
        src={media.thumbnailUri || ''}
        alt={'card media thumbnail'}
        width={media.width}
        height={media.height}
        data-loaded="false"
        onLoad={event => {
          event.currentTarget.setAttribute('data-loaded', 'true')
        }}
        className="data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 data-[loaded=false]:dark:bg-gray-500/10"
      />
      {/*<div>{thumbnailUri}</div>*/}
      {/*<div>{linkHref}</div>*/}
    </Link>
  )
}

export default CardMedia
