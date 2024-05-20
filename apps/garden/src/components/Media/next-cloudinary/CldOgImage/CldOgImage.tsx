import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '../../constants/sizes'
import { getCldOgImageUrl } from '../../helpers/getCldOgImageUrl'
import { CldImageProps } from '../CldImage/CldImage'
import OgImageTags from '@/components/Media/next-cloudinary/CldOgImage/OgImageTags'
import { getLimitedMediaDimensions } from '@/lib/media'
import React from 'react'

type TwitterCardType = 'summary_large_image' | 'player'

export type CldOgImageProps = CldImageProps & {
  excludeTags?: Array<string>
  keys?: object
  twitterTitle?: string
  twitterCard?: TwitterCardType
}

const CldOgImage = ({
  excludeTags = [],
  twitterTitle,
  twitterCard = 'summary_large_image',
  keys = {},
  ...props
}: CldOgImageProps) => {
  // We need to separately handle the width and the height to allow our user to pass in
  // a custom value, but also we need to know this at the component level so that we can
  // use it when rendering the meta tags
  let { width = OG_IMAGE_WIDTH, height = OG_IMAGE_HEIGHT } = props

  // Normalize the width and height

  width = typeof width === 'string' ? parseInt(width) : width
  height = typeof height === 'string' ? parseInt(height) : height

  const limitedDimensions = getLimitedMediaDimensions(
    Number(width || OG_IMAGE_WIDTH),
    Number(height || OG_IMAGE_HEIGHT),
  )

  // Render the final URLs. We use two different format versions to deliver
  // webp for Twitter as it supports it (and we can control with tags) where
  // other platforms may not support webp, so we deliver jpg

  const ogImageUrl =
    getCldOgImageUrl({
      ...props,
      format: 'jpg',
      width: limitedDimensions.width,
      height: limitedDimensions.height,
    }) + '.jpg'

  const twitterImageUrl =
    getCldOgImageUrl({
      ...props,
      width: limitedDimensions.width,
      height: limitedDimensions.height,
      format: props.format || 'webp',
    }) + (props.format || '.webp')

  return (
    <OgImageTags
      {...props}
      keys={keys}
      twitterTitle={twitterTitle}
      twitterCard={twitterCard}
      imageUrl={ogImageUrl}
      twitterImageUrl={twitterImageUrl}
      width={limitedDimensions.width}
      height={limitedDimensions.height}
      excludeTags={excludeTags}
    />
  )
}

export default CldOgImage
