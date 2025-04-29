'use client'

import ImageWithFallback from '@/components/media/image-with-fallback'
import { Card } from '@/components/ui/card'
import TypographyH6 from '@/components/ui/typography/TypographyH6'
import customImageLoader from '@/image-loader'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Props = {
  title: string
  description?: string
  image: string
  link: string
  priority?: boolean
}

type ToolCardMediaProps = {
  mediaUrl: string
  title?: string
  priority?: boolean
  sizes?: string
  variant?: 'thumbnail' | 'full'
}

export const ToolCardMedia = ({
  mediaUrl,
  title,
  priority,
  variant = 'full',
}: ToolCardMediaProps) => {
  return (
    <>
      {mediaUrl.endsWith('mp4') ? (
        <video
          autoPlay={variant === 'thumbnail' ? false : true}
          muted={true}
          loop={true}
          src={mediaUrl}
          playsInline={variant === 'thumbnail' ? false : true}
          className={cn(
            'absolute object-cover data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 dark:data-[loaded=false]:bg-gray-500/10',
            variant === 'thumbnail' ? 'w-12 h-12' : 'w-full h-full',
          )}
          onLoadedMetadata={event => {
            event.currentTarget.setAttribute('data-loaded', 'true')
          }}
        />
      ) : (
        <ImageWithFallback
          loading={priority ? undefined : 'lazy'}
          loader={customImageLoader}
          src={mediaUrl}
          alt={title || mediaUrl}
          data-loaded="false"
          onLoad={event => {
            event.currentTarget.setAttribute('data-loaded', 'true')
          }}
          fill={variant === 'thumbnail' ? false : true}
          priority={variant === 'thumbnail' ? false : priority}
          width={variant === 'thumbnail' ? 48 : undefined}
          height={variant === 'thumbnail' ? 48 : undefined}
          sizes={
            variant === 'thumbnail'
              ? undefined
              : '(max-width: 640px) 95vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw'
          }
          className="object-cover data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 dark:data-[loaded=false]:bg-gray-500/10"
        />
      )}
    </>
  )
}

const ToolCard = ({ title, image, link, description, priority }: Props) => {
  return (
    <Link prefetch={false} href={link} className="group aspect-square">
      <Card className="text-white relative min-h-64 flex flex-col justify-between overflow-hidden border-0 h-full w-full">
        <ToolCardMedia mediaUrl={image} title={title} priority={priority} />
        {/*<div className="relative flex flex-col group bg-gradient-to-b from-popover/90 from-10% via-transparent via-15% hover:via-100% hover:to-100% [@media(pointer:coarse)]:via-30% [@media(pointer:coarse)]:to-75% to-transparent flex-grow transition-all">*/}
        <div className="relative flex flex-col group generator-gradient flex-grow transition-all drop-shadow">
          <div className="px-3 py-2">
            <TypographyH6 className="flex items-center justify-between opacity-75 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100 transition-all">
              {title}
            </TypographyH6>
            <div className="text-sm line-clamp-2">{description}</div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default ToolCard
