import Image from 'next/image'
import { ReactNode, useState } from 'react'

export const ResponsiveImage = ({
  src,
  alt,
  aspectRatio,
  sizes,
  priority,
  children,
  onLoadingComplete,
  quality,
  className,
}: {
  src: string
  alt: string
  aspectRatio: number
  sizes?: string
  priority?: boolean
  children?: ReactNode
  onLoadingComplete?: () => void
  quality?: number
  className?: string
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const handleOnLoadingComplete = () => {
    setIsLoaded(true)
    onLoadingComplete && onLoadingComplete()
  }

  return (
    <div
      className={`relative ${
        !isLoaded ? 'bg-gray-100 dark:bg-gray-800' : ''
      } rounded-lg w-auto h-full ${className ? className : ''}`}
      style={{ aspectRatio: aspectRatio || 1 }}
    >
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        width={0}
        height={0}
        quality={quality}
        priority={priority}
        onLoadingComplete={handleOnLoadingComplete}
        className={`rounded-lg h-full w-full object-contain`}
      />
      {children}
    </div>
  )
}
