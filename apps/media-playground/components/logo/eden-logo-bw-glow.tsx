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
      width={width || 0}
      height={height || 0}
      sizes={'100vw'}
      src="/logo-bw.png"
      alt="Eden Logo"
      className={cn(
        'relative !w-[40px] !h-auto drop-shadow-[0_0_0.3rem_#00000070] dark:drop-shadow-[0_0_0.3rem_#ffffff70] invert dark:invert-0',
        className,
      )}
      priority={true}
    />
  )
}

export default EdenLogoBwGlow
