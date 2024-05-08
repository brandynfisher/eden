'use client'

import { CldImage as CldImageDefault, CldImageProps } from 'next-cloudinary'
import { RefObject } from 'react'

export default function CdnImage(props: CldImageProps & { ref?: RefObject<HTMLImageElement> }) {
  return <CldImageDefault {...props} />
}