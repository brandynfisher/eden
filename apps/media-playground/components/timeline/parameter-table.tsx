import TextClampMore from '../text/text-clamp-more'
import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import PreviewAudioPlayer from '@/components/timeline/preview-audio-player'
import PreviewVideoPlayer from '@/components/timeline/preview-video-player'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Long, cn, toBigInt } from '@/lib/utils'
import { TaskV2, TaskV2Args } from '@edenlabs/eden-sdk'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  LockKeyholeIcon,
  SquareCheckBigIcon,
  SquareIcon,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const INITIAL_VISIBLE_IMAGES = 4
const SHORT_STRING_LENGTH = 30

type ImageGalleryCellProps = {
  images: string[]
  className?: string
}

const ImageGalleryCell = React.memo(
  ({ images, className }: ImageGalleryCellProps) => {
    const [showAll, setShowAll] = useState(false)
    const [maxHeight, setMaxHeight] = useState<number>(384) // default 96 * 4 = 384px
    const containerRef = useRef<HTMLDivElement>(null)
    const galleryRef = useRef<HTMLDivElement>(null)

    const visibleImages = showAll
      ? images
      : images.slice(0, INITIAL_VISIBLE_IMAGES)
    const hasMore = images.length > INITIAL_VISIBLE_IMAGES

    useEffect(() => {
      if (!showAll || !containerRef.current) return

      const calculateMaxHeight = () => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()

        // Find the nearest scrollable parent (likely the dropdown content)
        let scrollParent = container.parentElement
        while (scrollParent) {
          const overflowY = window.getComputedStyle(scrollParent).overflowY
          if (overflowY === 'auto' || overflowY === 'scroll') {
            break
          }
          scrollParent = scrollParent.parentElement
        }

        let availableHeight: number
        if (scrollParent) {
          // Calculate space within scroll container
          const scrollRect = scrollParent.getBoundingClientRect()
          const spaceInContainer = scrollRect.bottom - rect.top
          availableHeight = Math.max(150, spaceInContainer - 100)
        } else {
          // Fallback to viewport calculation
          const viewportHeight = window.innerHeight
          const spaceBelow = viewportHeight - rect.top
          availableHeight = Math.max(150, spaceBelow - 100)
        }

        // Cap at reasonable max
        const calculatedHeight = Math.min(availableHeight, 400)
        setMaxHeight(calculatedHeight)
      }

      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        calculateMaxHeight()
      })

      window.addEventListener('resize', calculateMaxHeight)
      window.addEventListener('scroll', calculateMaxHeight, true)

      return () => {
        window.removeEventListener('resize', calculateMaxHeight)
        window.removeEventListener('scroll', calculateMaxHeight, true)
      }
    }, [showAll])

    return (
      <div className={cn('space-y-2', className)} ref={containerRef}>
        <div
          ref={galleryRef}
          className="flex flex-wrap gap-2 overflow-y-auto overflow-x-hidden scrollbar-thin"
          style={{ maxHeight: showAll ? `${maxHeight}px` : undefined }}
        >
          <LightboxGallery>
            {visibleImages.map((inputImageUrl, index) => (
              <LightboxTrigger
                className="rounded-lg cursor-zoom-in hover:brightness-105 h-32 w-48"
                key={`${inputImageUrl}_${index}`}
                slide={{
                  url: getCloudfrontOriginalUrl(inputImageUrl),
                  thumbnail: getCloudfrontOriginalUrl(inputImageUrl),
                  width: 1920,
                  height: 1080,
                }}
                startIndex={index}
                imageProps={{
                  unoptimized: true,
                }}
              />
            ))}
          </LightboxGallery>
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="w-full text-xs h-8"
          >
            {showAll ? (
              <>
                Show Less <ChevronUpIcon className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Show {images.length - INITIAL_VISIBLE_IMAGES} More{' '}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    )
  },
)

ImageGalleryCell.displayName = 'ImageGalleryCell'

const imageInputParameterNames = [
  'image',
  'init_image',
  'start_image',
  'start_media',
  'image_input',
  'end_image',
  'end_media',
  'mask_image',
  'prompt_image',
  'control_image',
  'control_input',
  'subject_image',
  'dummy_image',
  'person_image',
  'style_image',
  'images',
  'preference_anchor',
  'lora_training_urls',
  'reference_images',
  'poster_image',
]

const videoInputParameterNames = [
  'video',
  'input_video',
  'video1',
  'video2',
  'video3',
  'video4',
  'video5',
  'videos',
]

const audioInputParameterNames = [
  'audio',
  'voice_audio',
  'audio1',
  'audio2',
  'audio3',
  'audio4',
  'audio5',
  'audio_files',
  'audio_file',
]

const mixedMediaInputParameterNames = [
  'media_files',
  'media_inputs',
  'media_files',
]

const IMAGE_FILE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'tiff',
  'svg',
  'avif',
])

const VIDEO_FILE_EXTENSIONS = new Set([
  'mp4',
  'mov',
  'webm',
  'mkv',
  'avi',
  'flv',
  'wmv',
  'm4v',
])

const AUDIO_FILE_EXTENSIONS = new Set([
  'mp3',
  'wav',
  'ogg',
  'aac',
  'flac',
  'm4a',
  'mpeg',
])

type ParameterValue =
  | TaskV2Args[keyof TaskV2Args]
  | TaskV2['performance']
  | null

type Props = {
  taskId?: TaskV2['_id']
  cost?: number
  args: TaskV2Args
  performance?: TaskV2['performance']
  className?: string
  hideHeader?: boolean
}

const ParameterTable = React.memo(
  ({ taskId, cost, performance, args, hideHeader, className }: Props) => {
    const [, copy] = useCopyToClipboard()
    const handleCopyString = (parameterName: string, text: string) => () => {
      copy(text)
        .then(() => {
          toast.success(`Copied "${parameterName}"`, {
            description:
              text && text.length > 100 ? text.slice(0, 100) + '...' : text,
            dismissible: true,
            richColors: true,
          })
        })
        .catch(error => {
          toast.error(`Failed to copy!`, {
            description: error,
            dismissible: true,
            richColors: true,
          })
        })
    }

    const allArgs: [string, ParameterValue][] = taskId
      ? Object.entries({
          taskId,
          ...(cost !== undefined ? { cost } : {}),
          ...(performance &&
          (performance.waitTime !== undefined ||
            performance.runTime !== undefined)
            ? { performance }
            : {}),
          ...args,
        })
      : Object.entries({ ...args })

    const isValidMediaUrl = (val: unknown): val is string => {
      if (typeof val !== 'string') return false
      const urlRegex = /^(https?:\/\/|s3:\/\/|\/)/i
      return urlRegex.test(val.trim())
    }

    const collectMediaUrls = (paramValue: ParameterValue): string[] => {
      const pick = (input: unknown): string[] => {
        if (typeof input === 'string') {
          return [input]
        }
        if (input && typeof input === 'object') {
          // Check for various URL properties
          const obj = input as Record<string, unknown>
          if ('url' in obj && typeof obj.url === 'string') {
            return [obj.url]
          }
          if ('fileUrl' in obj && typeof obj.fileUrl === 'string') {
            return [obj.fileUrl]
          }
          if ('filename' in obj && typeof obj.filename === 'string') {
            return [obj.filename]
          }
        }
        return []
      }

      if (Array.isArray(paramValue)) {
        return paramValue.flatMap(pick)
      }

      return pick(paramValue)
    }

    const getFileExtension = (url: string): string => {
      try {
        const sanitized = url.split('#')[0]?.split('?')[0] ?? ''
        const lastDotIndex = sanitized.lastIndexOf('.')
        if (lastDotIndex === -1) return ''
        return sanitized.slice(lastDotIndex + 1).toLowerCase()
      } catch {
        return ''
      }
    }

    const getMediaTypeFromUrl = (url: string): 'image' | 'video' | 'audio' => {
      const extension = getFileExtension(url)
      if (AUDIO_FILE_EXTENSIONS.has(extension)) return 'audio'
      if (VIDEO_FILE_EXTENSIONS.has(extension)) return 'video'
      if (IMAGE_FILE_EXTENSIONS.has(extension)) return 'image'
      return 'image'
    }

    const renderImageContent = (
      urls: string[],
      overrides?: Pick<ImageGalleryCellProps, 'className'>,
    ) => ({
      isInline: false,
      content: <ImageGalleryCell images={urls} {...overrides} />,
    })

    const renderVideoContent = (urls: string[], wrapperClassName?: string) => ({
      isInline: false,
      content: (
        <div className={cn('flex flex-wrap gap-2', wrapperClassName)}>
          {urls.map(inputVideoUrl => (
            <PreviewVideoPlayer
              key={inputVideoUrl}
              src={inputVideoUrl}
              width={72}
              height={72}
              className="hover:brightness-105"
            />
          ))}
        </div>
      ),
    })

    const renderAudioContent = (urls: string[], wrapperClassName?: string) => ({
      isInline: false,
      content: (
        <div className={cn('flex flex-col gap-2', wrapperClassName)}>
          {urls.map(inputAudioUrl => (
            <PreviewAudioPlayer key={inputAudioUrl} src={inputAudioUrl} />
          ))}
        </div>
      ),
    })

    const renderMixedMediaContent = (urls: string[]) => {
      if (!urls.length) return null

      const categorized = urls.map(url => ({
        url,
        type: getMediaTypeFromUrl(url),
      }))

      const imageUrls = categorized
        .filter(item => item.type === 'image')
        .map(item => item.url)
      const videoUrls = categorized
        .filter(item => item.type === 'video')
        .map(item => item.url)
      const audioUrls = categorized
        .filter(item => item.type === 'audio')
        .map(item => item.url)

      return {
        isInline: false,
        content: (
          <div className="space-y-3">
            {imageUrls.length ? (
              <div key="images">
                {renderImageContent(imageUrls, { className: 'mt-0' }).content}
              </div>
            ) : null}
            {videoUrls.length ? (
              <div key="videos">{renderVideoContent(videoUrls).content}</div>
            ) : null}
            {audioUrls.length ? (
              <div key="audios">{renderAudioContent(audioUrls).content}</div>
            ) : null}
          </div>
        ),
      }
    }

    const renderValue = (paramName: string, value: ParameterValue) => {
      if (imageInputParameterNames.includes(paramName)) {
        const urls = collectMediaUrls(value).filter(isValidMediaUrl)
        if (urls.length) {
          return renderImageContent(urls)
        }
      }

      if (videoInputParameterNames.includes(paramName)) {
        const urls = collectMediaUrls(value).filter(isValidMediaUrl)
        if (urls.length) {
          return renderVideoContent(urls)
        }
      }

      if (audioInputParameterNames.includes(paramName)) {
        const urls = collectMediaUrls(value).filter(isValidMediaUrl)
        if (urls.length) {
          return renderAudioContent(urls)
        }
      }

      if (mixedMediaInputParameterNames.includes(paramName)) {
        const urls = collectMediaUrls(value).filter(isValidMediaUrl)
        const mixedContent = renderMixedMediaContent(urls)
        if (mixedContent) {
          return mixedContent
        }
      }

      // Handle boolean values
      if (typeof value === 'boolean') {
        return {
          isInline: true,
          content: value ? (
            <SquareCheckBigIcon size={16} />
          ) : (
            <SquareIcon size={16} />
          ),
        }
      }

      // Handle objects and arrays
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (paramName === 'performance') {
          return {
            isInline: true,
            content: (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  Wait time:
                </span>
                <span className="text-xs">
                  {value?.waitTime !== undefined
                    ? `${value.waitTime.toFixed(0)} s`
                    : 'n/a'}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  Run time:
                </span>
                <span className="text-xs">
                  {value?.runTime !== undefined
                    ? `${value.runTime.toFixed(0)} s`
                    : 'n/a'}
                </span>
              </div>
            ),
          }
        }

        // Handle JSON objects - stringify them
        if (value !== null && typeof value === 'object') {
          try {
            const jsonString = JSON.stringify(value, null, 2)
            const isLongJson = jsonString.length > SHORT_STRING_LENGTH

            return {
              isInline: !isLongJson,
              content: (
                <div onClick={handleCopyString(paramName, jsonString)}>
                  <TextClampMore
                    text={jsonString}
                    lines={isLongJson ? 3 : 1}
                    className="text-xs font-mono"
                  />
                </div>
              ),
            }
          } catch {
            // Fallback for objects that can't be stringified (like Long objects)
            return {
              isInline: true,
              content:
                value !== null
                  ? toBigInt(value as unknown as Long).toString()
                  : '-',
            }
          }
        }

        return {
          isInline: true,
          content:
            value !== null
              ? toBigInt(value as unknown as Long).toString()
              : '-',
        }
      }

      // Handle arrays
      if (Array.isArray(value)) {
        try {
          const jsonString = JSON.stringify(value, null, 2)
          const isLongJson = jsonString.length > SHORT_STRING_LENGTH

          return {
            isInline: !isLongJson,
            content: (
              <div onClick={handleCopyString(paramName, jsonString)}>
                <TextClampMore
                  text={jsonString}
                  lines={isLongJson ? 3 : 1}
                  className="text-xs font-mono"
                />
              </div>
            ),
          }
        } catch {
          // Fallback for arrays that can't be stringified
          return {
            isInline: true,
            content: String(value),
          }
        }
      }

      // Handle strings and other values
      const stringValue = String(value ?? '')
      const isLongString = stringValue.length > SHORT_STRING_LENGTH

      return {
        isInline: !isLongString,
        content: (
          <div onClick={handleCopyString(paramName, stringValue)}>
            <TextClampMore
              text={stringValue}
              lines={isLongString ? 2 : 1}
              className="text-xs"
            />
          </div>
        ),
      }
    }

    return (
      <Table className={cn([`text-xs table-fixed h-full`, className])}>
        {!hideHeader ? (
          <TableHeader className="rounded-t-lg overflow-hidden md:rounded-none md:overflow-auto">
            <TableRow className="bg-popover/50">
              <TableHead className="h-10 py-2 w-1/3 md:w-[150px]">
                Parameter
              </TableHead>
              <TableHead className="h-10 py-2 w-full">Value</TableHead>
            </TableRow>
          </TableHeader>
        ) : null}
        <TableBody className="bg-popover/20">
          {allArgs.map(([paramName, value]) => {
            const { isInline, content } = renderValue(paramName, value)

            return isInline ? (
              <TableRow key={paramName} className="cursor-pointer text-xs">
                <TableCell className="flex items-center gap-1 px-2 py-2 text-muted-foreground truncate w-[125px] align-middle">
                  {paramName}
                  {paramName === 'lora_training_urls' ? (
                    <LockKeyholeIcon className="relative h-3.5 w-3.5 flex-shrink-0" />
                  ) : null}
                </TableCell>
                <TableCell className="pl-0 pr-2 py-2 align-middle">
                  {content}
                </TableCell>
              </TableRow>
            ) : (
              <React.Fragment key={paramName}>
                <TableRow className="cursor-pointer text-xs">
                  <TableCell
                    colSpan={2}
                    className="flex items-center gap-1 px-2 py-2 pb-1 border-b-0 text-muted-foreground"
                  >
                    {paramName}
                    {paramName === 'lora_training_urls' ? (
                      <LockKeyholeIcon className="relative h-3.5 w-3.5 flex-shrink-0" />
                    ) : null}
                  </TableCell>
                </TableRow>
                <TableRow className="cursor-pointer text-xs">
                  <TableCell colSpan={2} className="px-2 py-1">
                    {content}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    )
  },
)

ParameterTable.displayName = 'ParameterTable'

export default ParameterTable
