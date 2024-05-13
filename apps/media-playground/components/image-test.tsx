'use client'

import CdnImage from '@/components/media/cdn-image'
import Image from 'next/image'

const ImageTest = () => {
  return (
    <div>
      <CdnImage
        src={'f2foqlaxko7md3brilii'}
        alt={'cdnimage'}
        className="w-auto"
        width={200}
        height={200}
      />
      <Image
        src={'https://d14i3advvh2bvd.cloudfront.net/df2fc1ee1f1ff92333bee01fffbf6d52d5b81b0b9174b18af2a5ddfd69e76b5b.png'}
        alt={'cdnimage'}
        className="w-auto"
        width={200}
        height={200}
      />
    </div>
  )
}

export default ImageTest