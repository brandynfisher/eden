'use client'

import { CldImage, CldImageProps } from 'next-cloudinary'
import Image, { ImageProps } from 'next/image'
import { useEffect, useState } from 'react'

const CdnImage = (props: CldImageProps&ImageProps) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  const { src, assetType, ...rest } = props

  const [ cldConfig, setCldConfig ] = useState<{cloud: {cloudName: string, apiKey: string}}|undefined>()

  useEffect(() => {
    if (!cloudName || !apiKey) {
      return
    }

    setCldConfig({
      cloud: {
        cloudName,
        apiKey
      }
    })
  }, [])

  if (!cldConfig) {
    return null
  }

  if (src && src.startsWith('https://res.cloudinary.com/')) {
    console.log({ cldConfig })

    if (cldConfig) {
      return <CldImage src={src} assetType={assetType} {...rest}/>
    }

    console.log('CLOUDINARY NAME OR APIKEY MISSING!', src)
    return null
  }

  // fallback to support local, other remote or existing s3/cloudfront assets
  return <Image src={src} {...{...rest, quality: props.quality ? Number(props.quality) : undefined, alt: props.alt ? props.alt : props.src}} />
}

export default CdnImage