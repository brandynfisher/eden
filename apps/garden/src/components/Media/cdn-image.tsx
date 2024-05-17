'use client'

import { CldImage, CldImageProps } from 'next-cloudinary'
import Image, { ImageProps } from 'next/image'
import { CONFIG } from '@/lib/config'

const CdnImage = (props: CldImageProps&ImageProps) => {
  const { src, assetType, ...rest } = props

  const cloudName = CONFIG.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = CONFIG.NEXT_PUBLIC_CLOUDINARY_API_KEY

  console.log({cloudName, apiKey})

  if (src && src.startsWith('https://res.cloudinary.com/')) {
    return <CldImage src={src} assetType={assetType} {...rest}/>
  }

  // fallback to support local, other remote or existing s3/cloudfront assets
  return <Image src={src} {...{...rest, quality: props.quality ? Number(props.quality) : undefined, alt: props.alt ? props.alt : props.src}} />
}

export default CdnImage