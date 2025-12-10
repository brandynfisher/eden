'use client'

import ImageWithFallback from '@/components/media/image-with-fallback'
import { Card } from '@/components/ui/card'
import TypographyH6 from '@/components/ui/typography/TypographyH6'
import { useNativeWebview } from '@/hooks/use-native-webview'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import Link from 'next/link'

type Props = {
  title: string
  description?: string
  image: string
  link: string
  priority?: boolean
  outputType?: string
  className?: string
  isActive?: boolean
  onClick?: () => void
}

type ToolCardMediaProps = {
  mediaUrl: string
  title?: string
  priority?: boolean
  sizes?: string
  variant?: 'thumbnail' | 'full'
  isNativeWebview?: boolean
}

export const ToolCardMedia = ({
  mediaUrl,
  title,
  priority,
  variant = 'full',
  isNativeWebview = false,
}: ToolCardMediaProps) => {
  return (
    <>
      {mediaUrl.endsWith('mp4') ? (
        <video
          autoPlay={variant === 'thumbnail' ? false : !isNativeWebview}
          muted={true}
          loop={true}
          src={mediaUrl}
          playsInline={variant === 'thumbnail' ? false : true}
          className={cn(
            'absolute inset-0 object-cover data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 dark:data-[loaded=false]:bg-gray-500/10 -z-10',
            variant === 'thumbnail'
              ? 'w-12 h-12'
              : !isNativeWebview
              ? 'w-full h-full transition-transform duration-500 group-hover:scale-105 group-focus:scale-105'
              : 'w-full h-full',
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
          className={cn(
            'object-cover data-[loaded=false]:animate-pulse data-[loaded=false]:bg-gray-950/20 dark:data-[loaded=false]:bg-gray-500/10 -z-10',
            variant === 'thumbnail'
              ? ''
              : !isNativeWebview
              ? 'transition-transform duration-500 group-hover:scale-105 group-focus:scale-105'
              : '',
          )}
        />
      )}
    </>
  )
}

const startCase = (value?: string | null) => {
  if (!value) return undefined
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

const formatOutputType = (outputType?: string) => {
  if (!outputType) return 'Creative Tool'
  return startCase(outputType) || 'Creative Tool'
}

const getRouteContext = (link: string, fallbackLabel: string) => {
  const segments = link.split('?')[0]?.split('/').filter(Boolean) || []
  const [root, output] = segments

  if (root === 'train') return 'Model Trainer'
  if (root === 'create' && output) return `${startCase(output)}`
  if (root === 'create') return 'Creation workspace'

  return fallbackLabel
}

const ToolCard = ({
  title,
  image,
  link,
  description,
  priority,
  outputType,
  className,
  isActive,
  onClick,
}: Props) => {
  const formattedOutputType = formatOutputType(outputType)
  const routeContext = getRouteContext(link, formattedOutputType)
  const isNativeWebview = useNativeWebview()

  const fallbackDescription =
    'See the guardrails, inputs, and costs for this workflow before you launch it.'

  return (
    <Link
      prefetch={false}
      href={link}
      onClick={onClick}
      className={cn('group block h-full', className)}
    >
      <Card
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-[#0B0B12] via-[#040406] to-[#050507] text-white transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/70 hover:shadow-[0px_35px_60px_-35px_rgba(0,0,0,0.85)]',
          isActive &&
            'ring-2 ring-primary/60 ring-offset-2 ring-offset-background border-primary/60 hover:border-primary/80',
        )}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden isolate">
          <ToolCardMedia
            mediaUrl={image}
            title={title}
            priority={priority}
            variant="full"
            isNativeWebview={isNativeWebview}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-50% to-black/90 transition-opacity duration-500 group-hover:to-black/85 group-focus:to-black/85 z-0" />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-4 pt-4 pb-2 z-10">
            <div className="flex flex-wrap gap-2"></div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.35em] text-white/70">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>{routeContext}</span>
              </div>
              <TypographyH6 className="text-xl font-semibold leading-tight text-white">
                {title}
              </TypographyH6>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-5 -mt-1">
          <p className="text-sm text-white/70 line-clamp-3">
            {description || fallbackDescription}
          </p>
        </div>
      </Card>
    </Link>
  )
}

export default ToolCard
