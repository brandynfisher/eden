'use client'

import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import { getSuspectedMediaType } from '@/features/sessions/utils/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'

interface AssistantAttachmentGridProps {
  attachments: string[]
  messageId: string
  className?: string
}

/**
 * Optimized attachment grid for assistant/agent messages.
 * - Single image: natural aspect ratio with max constraints
 *   - Landscape: up to 480px wide (wider on desktop)
 *   - Portrait: max 320px height to avoid taking too much vertical space
 * - Multiple images: responsive grid
 */
export const AssistantAttachmentGrid = ({
  attachments,
  messageId,
  className,
}: AssistantAttachmentGridProps) => {
  const count = attachments.length

  if (count === 0) return null

  // For single image, let it display at natural aspect ratio with sensible limits
  if (count === 1) {
    const attachment = attachments[0]
    const mediaType = getSuspectedMediaType(attachment)
    const isMedia =
      mediaType === 'image' || mediaType === 'video' || mediaType === 'audio'

    return (
      <LightboxGallery galleryKey={messageId}>
        <div className={cn('mt-3', className)}>
          {isMedia ? (
            <LightboxTrigger
              startIndex={0}
              className="block"
              slide={{
                type: mediaType,
                duration: mediaType === 'video' ? 0 : undefined,
                url:
                  mediaType === 'audio'
                    ? attachment
                    : getCloudfrontOriginalUrl(attachment),
              }}
              imageProps={{
                // Landscape images can be wider, portrait images are height-limited
                // max-w-[480px] on mobile, max-w-[560px] on desktop
                // max-h-[320px] prevents tall portrait images from dominating
                className:
                  'h-auto rounded-lg object-contain max-w-full max-h-[320px] sm:max-w-[480px] md:max-w-[560px]',
                unoptimized: true,
                loading: 'lazy',
              }}
              videoProps={{
                className:
                  'h-auto rounded-lg max-w-full max-h-[320px] sm:max-w-[480px] md:max-w-[560px]',
              }}
            />
          ) : (
            <div className="w-48 h-32 flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
              <div className="text-xs font-medium">
                {(() => {
                  try {
                    const pathname = new URL(attachment).pathname
                    return pathname.split('.').pop()?.toUpperCase() || 'FILE'
                  } catch {
                    return (
                      attachment
                        .split('?')[0]
                        .split('.')
                        .pop()
                        ?.toUpperCase() || 'FILE'
                    )
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      </LightboxGallery>
    )
  }

  // For multiple images, use a responsive grid
  // 2 columns on mobile, up to 3 on larger screens
  return (
    <LightboxGallery galleryKey={messageId}>
      <div
        className={cn(
          'mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-[480px]',
          className,
        )}
      >
        {attachments.map((attachment, index) => {
          const mediaType = getSuspectedMediaType(attachment)
          const isMedia =
            mediaType === 'image' ||
            mediaType === 'video' ||
            mediaType === 'audio'

          return (
            <div
              key={attachment}
              className="relative rounded-lg overflow-hidden aspect-square"
            >
              {isMedia ? (
                <LightboxTrigger
                  startIndex={index}
                  className="block w-full h-full"
                  slide={{
                    type: mediaType,
                    duration: mediaType === 'video' ? 0 : undefined,
                    url:
                      mediaType === 'audio'
                        ? attachment
                        : getCloudfrontOriginalUrl(attachment),
                  }}
                  imageProps={{
                    className: 'w-full h-full object-cover rounded-lg',
                    unoptimized: true,
                    loading: 'lazy',
                  }}
                  videoProps={{
                    className: 'w-full h-full object-cover rounded-lg',
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted rounded-lg">
                  <div className="text-xs font-medium">
                    {(() => {
                      try {
                        const pathname = new URL(attachment).pathname
                        return (
                          pathname.split('.').pop()?.toUpperCase() || 'FILE'
                        )
                      } catch {
                        return (
                          attachment
                            .split('?')[0]
                            .split('.')
                            .pop()
                            ?.toUpperCase() || 'FILE'
                        )
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </LightboxGallery>
  )
}
