import TextClampMore from '../text/text-clamp-more'
import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
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

const ImageGalleryCell = ({ images }: { images: string[] }) => {
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
    <div className="space-y-2 mt-2" ref={containerRef}>
      <div
        ref={galleryRef}
        className="flex flex-wrap gap-2 overflow-y-auto overflow-x-hidden scrollbar-thin"
        style={{ maxHeight: showAll ? `${maxHeight}px` : undefined }}
      >
        <LightboxGallery>
          {visibleImages.map((inputImageUrl, index) => (
            <LightboxTrigger
              className="!relative rounded-lg cursor-zoom-in hover:brightness-105 !h-20 w-auto"
              key={`${inputImageUrl}_${index}`}
              slide={{
                url: getCloudfrontOriginalUrl(inputImageUrl),
                thumbnail: getCloudfrontOriginalUrl(inputImageUrl),
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
}

const imageInputParameterNames = [
  'image',
  'init_image',
  'start_image',
  'start_media',
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
]

const videoInputParameterNames = [
  'video',
  'input_video',
  'video1',
  'video2',
  'video3',
  'video4',
  'video5',
]

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

const ParameterTable = ({
  taskId,
  cost,
  performance,
  args,
  hideHeader,
  className,
}: Props) => {
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

  const isValidImageUrl = (val: unknown): boolean => {
    if (typeof val !== 'string') return false
    // Check if it's a valid URL (http/https or S3-style path)
    const urlRegex = /^(https?:\/\/|s3:\/\/|\/)/i
    return urlRegex.test(val.trim())
  }

  const renderValue = (paramName: string, value: ParameterValue) => {
    // Handle media types - always render below
    if (imageInputParameterNames.includes(paramName)) {
      // Filter to only valid URLs
      const imageUrls = [value as string]
        .flat()
        .filter(Boolean)
        .filter(isValidImageUrl)

      // Only render as images if we have valid URLs
      if (imageUrls.length > 0) {
        return {
          isInline: false,
          content: <ImageGalleryCell images={imageUrls} />,
        }
      }

      // Fall through to render as text if no valid URLs
    }

    if (videoInputParameterNames.includes(paramName)) {
      return {
        isInline: false,
        content: (
          <div className="flex flex-wrap gap-2">
            {((Array.isArray(value) ? value : [value]) as string[])
              .filter(Boolean)
              .map(inputVideoUrl => (
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
              <span className="text-xs text-muted-foreground">Wait time:</span>
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
          value !== null ? toBigInt(value as unknown as Long).toString() : '-',
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

          return (
            <TableRow key={paramName} className="cursor-pointer text-xs">
              <TableCell
                className={cn(
                  'flex items-center gap-1 px-2 py-2 text-muted-foreground truncate',
                  isInline
                    ? 'w-[125px] align-middle'
                    : 'w-full pb-1 border-b-0',
                )}
              >
                {paramName}
                {paramName === 'lora_training_urls' ? (
                  <LockKeyholeIcon className="relative h-3.5 w-3.5 flex-shrink-0" />
                ) : null}
              </TableCell>
              <TableCell
                className={cn(
                  'pl-0 pr-2 py-2',
                  isInline ? 'align-middle' : 'pt-0',
                )}
              >
                {content}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default ParameterTable
