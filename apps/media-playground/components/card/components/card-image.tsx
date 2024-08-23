import customImageLoader from '@/image-loader'
import { siteConfig } from '@/lib/config'
import { Media } from '@/types/Media'
import Image from 'next/image'

type Props = {
  media: Media
}

const CardImage = ({ media }: Props) => {
  // console.log(media)
  return (
    <Image
      data-test-id={'card-image'}
      sizes={'(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 15vw'}
      loader={customImageLoader}
      src={
        media.thumbnail ||
        (media.type === 'image' ? media.url : siteConfig.mediaErrorUrl) ||
        ''
      }
      alt={'card media thumbnail'}
      width={media.width || 1024}
      height={media.height || 1024}
      data-loaded="false"
      onLoad={event => {
        event.currentTarget.setAttribute('data-loaded', 'true')
      }}
      className="data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 data-[loaded=false]:dark:bg-gray-500/10 w-full h-full"
    />
  )
}

export default CardImage
