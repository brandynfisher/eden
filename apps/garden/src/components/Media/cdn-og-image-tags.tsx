import CldOgImage, {
  CldOgImageProps,
} from '@/components/Media/next-cloudinary/CldOgImage/CldOgImage'
import OgImageTags from '@/components/Media/next-cloudinary/CldOgImage/OgImageTags'
import React from 'react'

const CdnOgImageTags = (props: CldOgImageProps) => {
  const { width, height, ...rest } = props

  if (props.src && props.src.startsWith('https://res.cloudinary.com/')) {
    return <CldOgImage {...rest} />
  }

  return (
    <OgImageTags
      {...rest}
      width={width}
      height={height}
      imageUrl={props.src}
      twitterImageUrl={props.src}
    />
  )
}

export default CdnOgImageTags
