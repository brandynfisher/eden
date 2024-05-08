'use client'

import { CldImage as CldImageDefault, CldImageProps } from 'next-cloudinary'
import Image, { ImageProps } from 'next/image'
import React, { forwardRef } from 'react'

const CdnImage = forwardRef<HTMLImageElement, CldImageProps&ImageProps>((
  props,
  ref
) => {
  if (props.src.startsWith('https://res.cloudinary.com/')) {
    return <CldImageDefault ref={ref} {...props} />
  }

  return <Image ref={ref} {...{...props, quality: props.quality ? Number(props.quality) : undefined, alt: props.alt ? props.alt : props.src}} />
})
CdnImage.displayName = 'CdnImage'

export default CdnImage