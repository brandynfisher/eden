'use client'

import Image, { ImageProps } from 'next/image'
import CldImage, { CldImageProps } from '@/components/Media/next-cloudinary/CldImage/CldImage'

const CdnImage = (props: CldImageProps&ImageProps) => {
  const { src, assetType, ...rest } = props

  if (src && src.startsWith('https://res.cloudinary.com/')) {
      return <CldImage src={src} assetType={assetType} {...rest}/>
  }

  // fallback to support local, other remote or existing s3/cloudfront assets
  return <Image src={src} {...{...rest, quality: props.quality ? Number(props.quality) : undefined, alt: props.alt ? props.alt : props.src}} />
}

export default CdnImage