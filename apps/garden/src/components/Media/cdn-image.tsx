'use client'

import { CldImage as CldImageDefault, CldImageProps } from 'next-cloudinary'
import Image, { ImageProps } from 'next/image'
import React, { forwardRef } from 'react'

const CdnImage = forwardRef<HTMLImageElement, CldImageProps&ImageProps>((
  props,
  ref
) => {
  const { assetType, ...rest } = props
  if (props.src.startsWith('https://res.cloudinary.com/')) {
    return <CldImageDefault ref={ref} assetType={assetType} {...rest} />
  }

  return <Image ref={ref} {...{...rest, quality: props.quality ? Number(props.quality) : undefined, alt: props.alt ? props.alt : props.src}} />
})
CdnImage.displayName = 'CdnImage'

export default CdnImage