import CldOgImage, {
  CldOgImageProps,
} from '@/components/Media/next-cloudinary/CldOgImage/CldOgImage'
import OgImageTags from '@/components/Media/next-cloudinary/CldOgImage/OgImageTags'
import React from 'react'

const CdnOgImageTags = (props: CldOgImageProps & { uri?: string }) => {
  if (props.src && props.src.startsWith('https://res.cloudinary.com/')) {
    return <CldOgImage {...props} />
  }

  return (
    <OgImageTags {...props} imageUrl={props.src} twitterImageUrl={props.src} />
  )
}

export default CdnOgImageTags
