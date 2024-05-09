'use client'

import { CldImage as CldImageDefault, CldImageProps } from 'next-cloudinary'
import Image, { ImageProps } from 'next/image'

const CdnImage = (props: CldImageProps&ImageProps) => {
  const { assetType, ...rest } = props
  if (props.src && props.src.startsWith('https://res.cloudinary.com/')) {
    return <CldImageDefault assetType={assetType} {...rest} />
  }

  // fallback to support local, other remote or existing s3/cloudfront assets
  return <Image {...{...rest, quality: props.quality ? Number(props.quality) : undefined, alt: props.alt ? props.alt : props.src}} />
}

export default CdnImage