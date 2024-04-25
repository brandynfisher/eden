import { cn } from '@/lib/utils'
import Image from 'next/image'
import { FC } from 'react'

interface Props {
  className?: string
  width?: number
  height?: number
}

export const EdenLogoBwGlow: FC<Props> = ({width, height, className }) => {
  return (
    <Image
      width={width}
      height={height}
      src="/logo-bw.png"
      alt="Eden Logo"
      className={cn(
        'relative !w-[43px] !h-auto drop-shadow-[0_0_0.3rem_#00000070] dark:drop-shadow-[0_0_0.3rem_#ffffff70] invert dark:invert-0',
        className,
      )}
      priority={true}
    />
  )
}

export default EdenLogoBwGlow
