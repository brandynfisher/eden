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

  // Determine grid layout based on count
  const getGridLayout = (count: number) => {
    if (count === 1) {
      return 'w-full max-w-full'
    }

    if (count === 2) {
      return 'grid grid-cols-2 gap-2 w-full'
    }

    if (count === 3) {
      return 'grid grid-cols-3 gap-2 w-full'
    }

    if (count === 4) {
      return 'grid grid-cols-2 gap-2 w-full'
    }

    // 5+ items: use responsive grid
    return 'grid grid-cols-2 md:grid-cols-3 gap-2 w-full'
  }

  const layout = getGridLayout(visualOutputs.length)

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
        <div className={cn('mb-2', layout)}>
          {visualOutputs.map((item, index) => {
            const aspectRatio = getAspectRatio(item.output)
            return (
              <div
                key={`${item.resultIndex}-${item.outputIndex}-${item.output.filename}`}
                className="group relative overflow-hidden rounded-lg w-full"
                style={{ aspectRatio: aspectRatio.toString() }}
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
                    className: 'object-contain',
                  }}
                  videoProps={{
                    className: 'object-contain',
                  }}
                />
              </div>
            )
          })}
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
