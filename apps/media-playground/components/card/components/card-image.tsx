import customImageLoader from '@/image-loader'
import { siteConfig } from '@/lib/config'
import { Media } from '@/types/Media'
import { createCanvas } from 'canvas'
import { decodeBlurHash } from 'fast-blurhash'
import Image from 'next/image'
import React from 'react'

type Props = {
  media: Media
}

const CardImage = ({ media }: Props) => {
  const blurDataUrl = React.useMemo(() => {
    if (!media.blur) return ''
    const width = media.width || 1024
    const height = media.height || 1024
    const pixels = decodeBlurHash(media.blur, width, height)
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    const imageData = new ImageData(pixels, width, height)
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  }, [media.blur])

  return (
    <Image
      data-test-id={'card-image'}
      sizes={'(max-width: 768px) 30vw, (max-width: 1280px) 20vw, 15vw'}
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
      blurDataURL={blurDataUrl}
      placeholder={blurDataUrl ? 'blur' : 'empty'}
      className="data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 data-[loaded=false]:dark:bg-gray-500/10 w-full h-full"
    />
  )
}

export default CardImage
