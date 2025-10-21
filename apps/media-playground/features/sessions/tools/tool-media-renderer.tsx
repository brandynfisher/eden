'use client'

import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import TextClampMore from '@/components/text/text-clamp-more'
import { getFileTypeByMimeType } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  TaskV2Args,
  TaskV2Result,
  TasksV2ResultOutput,
} from '@edenlabs/eden-sdk'
import React from 'react'
import ReactMarkdown from 'react-markdown'

export type ToolMediaRendererProps = {
  results: TaskV2Result[]
  args?: TaskV2Args
}

export const ToolMediaRenderer: React.FC<ToolMediaRendererProps> = ({
  results,
  args,
}) => {
  // Flatten all media outputs from all results
  const allMediaOutputs =
    results?.flatMap((result, resultIndex) =>
      Array.isArray(result?.output)
        ? result.output.map((output, outputIndex) => ({
            output,
            resultIndex,
            outputIndex,
          }))
        : [],
    ) || []

  // Separate audio from visual media
  const audioOutputs = allMediaOutputs.filter(
    item =>
      getFileTypeByMimeType(item.output.mediaAttributes?.mimeType) === 'audio',
  )
  const visualOutputs = allMediaOutputs.filter(
    item =>
      getFileTypeByMimeType(item.output.mediaAttributes?.mimeType) !== 'audio',
  )

  // Text-only results
  const textResults =
    results?.filter(result => !Array.isArray(result?.output)) || []

  // Calculate aspect ratio for an output
  const getAspectRatio = (output: TasksV2ResultOutput) => {
    const width = output.mediaAttributes?.width || 16
    const height = output.mediaAttributes?.height || 9
    return width / height
  }

  // Determine grid layout based on count and aspect ratios
  const getGridLayout = (
    count: number,
    outputs: { output: TasksV2ResultOutput }[],
  ) => {
    if (count === 1) {
      return {
        gridClass: '',
        itemClasses: ['aspect-video max-h-[500px] w-full'],
      }
    }

    if (count === 2) {
      const avgAspect =
        outputs.reduce((sum, item) => sum + getAspectRatio(item.output), 0) /
        count
      // If images are very wide (> 2.5), stack vertically
      if (avgAspect > 2.5) {
        return {
          gridClass: 'grid grid-rows-2 gap-2',
          itemClasses: ['aspect-video', 'aspect-video'],
        }
      }
      // Otherwise side by side
      return {
        gridClass: 'grid grid-cols-2 gap-2',
        itemClasses: ['aspect-square', 'aspect-square'],
      }
    }

    if (count === 3) {
      const aspects = outputs.map(item => getAspectRatio(item.output))
      const avgAspect = aspects.reduce((a, b) => a + b, 0) / count

      // If tall images (< 0.8), use 3 columns in a single row
      if (avgAspect < 0.8) {
        return {
          gridClass: 'grid grid-cols-3 gap-2',
          itemClasses: [
            'aspect-[3/4] h-full',
            'aspect-[3/4] h-full',
            'aspect-[3/4] h-full',
          ],
        }
      }

      // For normal/wide images: use 3 columns in a single row taking up all horizontal space
      return {
        gridClass: 'grid grid-cols-3 gap-2',
        itemClasses: [
          'aspect-square h-full',
          'aspect-square h-full',
          'aspect-square h-full',
        ],
      }
    }

    if (count === 4) {
      const aspects = outputs.map(item => getAspectRatio(item.output))
      const avgAspect = aspects.reduce((a, b) => a + b, 0) / count

      // If very tall images (< 0.7), use 4 columns
      if (avgAspect < 0.7) {
        return {
          gridClass: 'grid grid-cols-4 gap-2',
          itemClasses: [
            'aspect-[3/4]',
            'aspect-[3/4]',
            'aspect-[3/4]',
            'aspect-[3/4]',
          ],
        }
      }

      // If very wide images (> 2.5), use 4 rows
      if (avgAspect > 2.5) {
        return {
          gridClass: 'grid grid-rows-4 gap-2',
          itemClasses: [
            'aspect-video',
            'aspect-video',
            'aspect-video',
            'aspect-video',
          ],
        }
      }

      // Default: 2x2 grid
      return {
        gridClass: 'grid grid-cols-2 gap-2',
        itemClasses: [
          'aspect-square',
          'aspect-square',
          'aspect-square',
          'aspect-square',
        ],
      }
    }

    // 5+ items: use responsive grid
    return {
      gridClass: 'grid grid-cols-2 md:grid-cols-3 gap-2',
      itemClasses: Array(count).fill('aspect-square'),
    }
  }

  const layout = getGridLayout(visualOutputs.length, visualOutputs)

  // If no media outputs, return null
  if (
    visualOutputs.length === 0 &&
    audioOutputs.length === 0 &&
    textResults.length === 0
  ) {
    return null
  }

  return (
    <LightboxGallery>
      {/* Visual media grid */}
      {visualOutputs.length > 0 && (
        <div className={cn('mb-2', layout.gridClass)}>
          {visualOutputs.map((item, index) => (
            <div
              key={`${item.resultIndex}-${item.outputIndex}-${item.output.filename}`}
              className="group relative overflow-hidden rounded-lg"
            >
              <div
                draggable
                onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                  const url = getCloudfrontOriginalUrl(item.output.filename)
                  e.dataTransfer.setData('text/plain', '')
                  e.dataTransfer.setData(
                    'application/json',
                    JSON.stringify({
                      fileUrl: url,
                      type:
                        item.output.mediaAttributes?.mimeType || 'image/jpeg',
                      name: url,
                    }),
                  )
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                className={cn('relative w-full', layout.itemClasses[index])}
              >
                <LightboxTrigger
                  className="absolute inset-0"
                  slide={{
                    type: 'video',
                    url:
                      getCloudfrontOriginalUrl(item.output.filename) ||
                      item.output.url ||
                      '',
                    thumbnail:
                      getCloudfrontOriginalUrl(item.output.filename) ||
                      item.output.url ||
                      '',
                    width: item.output.mediaAttributes?.width,
                    height: item.output.mediaAttributes?.height,
                    duration:
                      item.output.mediaAttributes?.duration || undefined,
                    description:
                      args && args.prompt ? String(args.prompt) : undefined,
                    title:
                      args && args.prompt ? String(args.prompt) : undefined,
                  }}
                  startIndex={index}
                  imageProps={{
                    loading: 'lazy',
                    blurhash: item.output.mediaAttributes?.blurhash,
                    className: 'object-cover',
                  }}
                  videoProps={{
                    className: 'object-cover',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audio outputs */}
      {audioOutputs.length > 0 && (
        <div className="flex flex-col gap-2 mb-2">
          {audioOutputs.map(item => (
            <audio
              key={`${item.resultIndex}-${item.outputIndex}-${item.output.filename}`}
              controls
              className="w-full max-w-2xl"
            >
              <source
                src={getCloudfrontOriginalUrl(item.output.filename)}
                type={item.output.mediaAttributes?.mimeType}
              />
            </audio>
          ))}
        </div>
      )}

      {/* Text results */}
      {textResults.map((result, index) => (
        <div
          key={`text-${index}`}
          className="px-4 p-2 bg-accent rounded-md border border-secondary text-sm mb-2"
        >
          <TextClampMore
            text={
              typeof result?.output === 'string' ? (
                <ReactMarkdown>
                  {(result.output as string).replace(/\n/g, '  \n')}
                </ReactMarkdown>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-xs">
                  {JSON.stringify(result?.output, null, 2)}
                </pre>
              )
            }
            lines={3}
          />
        </div>
      ))}
    </LightboxGallery>
  )
}
