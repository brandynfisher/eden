import customImageLoader from '@/image-loader'
import { siteConfig } from '@/lib/config'
import { calculateMaxDimensions } from '@/lib/media'
import { Media } from '@/types/Media'
import { createCanvas } from 'canvas'
import { decodeBlurHash } from 'fast-blurhash'
import Image from 'next/image'
import { useMemo } from 'react'

type Props = {
  media: Media
}

const CardImage = ({ media }: Props) => {
  const { blur, width, height } = media

  const blurDataUrl = useMemo(() => {
    if (!blur) return ''

    const { width: blurWidth, height: blurHeight } = calculateMaxDimensions(
      (width || 1024) / (height || 1024),
      32,
    )
    const pixels = decodeBlurHash(blur, blurWidth, blurHeight)
    const canvas = createCanvas(blurWidth, blurHeight)
    const ctx = canvas.getContext('2d')
    const imageData = new ImageData(pixels, blurWidth, blurHeight)
    ctx.putImageData(imageData, 0, 0)

    console.log({ storedBlur: blur, cvsBlur: canvas.toDataURL() })

    return canvas.toDataURL()
  }, [blur, width, height])

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
      // src={blurDataUrl}
      alt={'card media thumbnail'}
      width={media.width || 1024}
      height={media.height || 1024}
      blurDataURL={blurDataUrl}
      placeholder={blurDataUrl ? 'blur' : undefined}
      className="w-full h-full"
      // className="data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 data-[loaded=false]:dark:bg-gray-500/10 w-full h-full"
    />
  )
}

export default CardImage
