'use client'

import ImageWithFallback from '@/components/media/image-with-fallback'
import { Card } from '@/components/ui/card'
import TypographyH6 from '@/components/ui/typography/TypographyH6'
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
          // loader={customImageLoader}
          src={mediaUrl}
          alt={title || mediaUrl}
          data-loaded="false"
          unoptimized={true}
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
    <Link prefetch={false} href={link} className="group">
      <Card className="overflow-hidden border  hover:border-purple-500/50 transition-all duration-300 h-full w-full">
        <div className="p-2 flex items-center gap-2">
          <div className="relative w-48 aspect-[4/3] flex-shrink-0 overflow-hidden rounded-sm">
            <ToolCardMedia
              mediaUrl={image}
              title={title}
              priority={priority}
              variant="full"
            />
          </div>

          {/* Content Container - Takes remaining space */}
          <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
            <TypographyH6 className="text-white text-base font-medium mb-1 line-clamp-1">
              {title}
            </TypographyH6>
            <div className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
              {description}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default ToolCard
