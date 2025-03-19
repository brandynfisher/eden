import { cn } from '@/lib/utils'
import Image from 'next/image'
import { FC } from 'react'

// import customImageLoader from '../../image-loader';

interface Props {
  className?: string
  width?: number
  height?: number
}

export const EdenLogoBw: FC<Props> = ({ width, height, className }) => {
  return (
    <Image
      width={width || 0}
      height={height || 0}
      sizes={'100vw'}
      src="https://d14i3advvh2bvd.cloudfront.net/app/logos/android-chrome-192x192.png"
      alt="Eden Logo"
      className={cn('relative w-[40px] h-auto invert dark:invert-0', className)}
      priority={true}
      unoptimized={true}
    />
  )
}

export default EdenLogoBw
