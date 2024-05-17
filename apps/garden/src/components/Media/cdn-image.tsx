'use client'

import { CldImage, CldImageProps } from 'next-cloudinary'
import Image, { ImageProps } from 'next/image'
// import { CONFIG } from '@/lib/config'
import { useEffect, useState } from 'react'

const CdnImage = (props: CldImageProps&ImageProps) => {
  const { src, assetType, ...rest } = props

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
  // const cloudName = CONFIG.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  // const apiKey = CONFIG.NEXT_PUBLIC_CLOUDINARY_API_KEY

  const [ cldConfig, setCldConfig ] = useState<{cloud: {cloudName: string, apiKey: string}}|undefined>(cloudName && apiKey ? { cloud: { cloudName, apiKey } }: undefined)

  useEffect(() => {
    if (!cloudName || !apiKey) {
      console.log('useEffect CLOUDINARY NAME OR APIKEY MISSING!')
      return
    }

    setCldConfig({
      cloud: {
        cloudName,
        apiKey
      }
    })
  }, [cloudName, apiKey])

  if (src && src.startsWith('https://res.cloudinary.com/')) {
    if (!cldConfig) {
      console.log('CLOUDINARY NAME OR APIKEY MISSING!', src)
      return null
    }

    // console.log({cldConfig})

    return <CldImage src={src} assetType={assetType} {...rest} config={cldConfig}/>
  }

  // fallback to support local, other remote or existing s3/cloudfront assets
  return <Image src={src} {...{...rest, quality: props.quality ? Number(props.quality) : undefined, alt: props.alt ? props.alt : props.src}} />
}

export default CdnImage