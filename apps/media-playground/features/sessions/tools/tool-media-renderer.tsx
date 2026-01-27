'use client'

import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import TextClampMore from '@/components/text/text-clamp-more'
import { ToolActionButton } from '@/features/sessions/components/tool-result-action-bar'
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
  // Ensure results is always an array (API might return single object for some tools)
  const normalizedResults = Array.isArray(results)
    ? results
    : results
    ? [results]
    : []

  // Flatten all outputs from all results
  const allOutputs =
    normalizedResults.flatMap((result, resultIndex) =>
      Array.isArray(result?.output)
        ? result.output.map((output, outputIndex) => ({
            output,
            resultIndex,
            outputIndex,
          }))
        : [],
    ) || []

  // Helper to check if an output has actual renderable media
  const hasRenderableMedia = (
    output: TasksV2ResultOutput | string,
  ): boolean => {
    // Strings are never media
    if (typeof output === 'string') return false
    // Must have a filename to be renderable as media
    if (!output?.filename) return false
    // Check if it has a media mimeType (image, video, audio)
    const mimeType = output.mediaAttributes?.mimeType
    if (mimeType) {
      const type = mimeType.split('/')[0]
      return ['image', 'video', 'audio'].includes(type)
    }
    // If no mimeType but has filename, assume it might be media
    // (fallback for legacy data)
    return true
  }

  // Separate audio from visual media - only include items with actual media
  const audioOutputs = allOutputs.filter(
    item =>
      hasRenderableMedia(item.output) &&
      getFileTypeByMimeType(item.output.mediaAttributes?.mimeType) === 'audio',
  )
  const visualOutputs = allOutputs.filter(
    item =>
      hasRenderableMedia(item.output) &&
      getFileTypeByMimeType(item.output.mediaAttributes?.mimeType) !== 'audio',
  )

  // Text-only items from array outputs (items without renderable media)
  const textOnlyOutputs = allOutputs.filter(
    item => !hasRenderableMedia(item.output),
  )

  // Text-only results (when output is a string, not an array)
  const textResults = normalizedResults.filter(
    result => !Array.isArray(result?.output),
  )

  // Calculate aspect ratio for an output
  const getAspectRatio = (output: TasksV2ResultOutput) => {
    const rawWidth = output.mediaAttributes?.width
    const rawHeight = output.mediaAttributes?.height
    const width =
      typeof rawWidth === 'number' && Number.isFinite(rawWidth) && rawWidth > 0
        ? rawWidth
        : null
    const height =
      typeof rawHeight === 'number' &&
      Number.isFinite(rawHeight) &&
      rawHeight > 0
        ? rawHeight
        : null
    const fallback = 16 / 9
    const ratio = width && height ? width / height : fallback
    if (!Number.isFinite(ratio) || ratio <= 0) return fallback
    // Clamp extreme ratios to avoid massive layout jumps.
    return Math.min(Math.max(ratio, 0.5), 3)
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

  // If no outputs at all, return null
  if (
    visualOutputs.length === 0 &&
    audioOutputs.length === 0 &&
    textOnlyOutputs.length === 0 &&
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
            const creationId =
              typeof item.output.creation === 'string'
                ? item.output.creation
                : item.output.creation?._id
            return (
              <div
                key={`${item.resultIndex}-${item.outputIndex}-${item.output.filename}`}
                className="flex flex-col gap-2"
              >
                <div
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
                {creationId ? (
                  <ToolActionButton creationId={creationId} />
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {/* Audio outputs */}
      {audioOutputs.length > 0 && (
        <div className="flex flex-col gap-2 mb-2">
          {audioOutputs.map(item => {
            const creationId =
              typeof item.output.creation === 'string'
                ? item.output.creation
                : item.output.creation?._id
            return (
              <div
                key={`${item.resultIndex}-${item.outputIndex}-${item.output.filename}`}
                className="flex flex-col gap-2"
              >
                <audio controls className="w-full max-w-2xl">
                  <source
                    src={getCloudfrontOriginalUrl(item.output.filename)}
                    type={item.output.mediaAttributes?.mimeType}
                  />
                </audio>
                {creationId ? (
                  <ToolActionButton creationId={creationId} />
                ) : null}
              </div>
            )
          })}
        </div>
      )}

      {/* Text-only outputs from array results */}
      {textOnlyOutputs.length > 0 && (
        <div className="mb-2">
          <TextClampMore
            text={
              <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                {textOnlyOutputs.map(item => {
                  const output = item.output
                  // Handle different output formats
                  const textContent =
                    typeof output === 'string'
                      ? output
                      : output?.text ||
                        (typeof output === 'object'
                          ? JSON.stringify(output, null, 2)
                          : String(output))

                  const isMarkdownText =
                    typeof output === 'string' || output?.text

                  return (
                    <div
                      key={`text-output-${item.resultIndex}-${item.outputIndex}`}
                    >
                      {isMarkdownText ? (
                        <ReactMarkdown>{textContent}</ReactMarkdown>
                      ) : (
                        <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/50 p-2 rounded">
                          {textContent}
                        </pre>
                      )}
                    </div>
                  )
                })}
              </div>
            }
            lines={4}
          />
        </div>
      )}

      {/* Text results (when output is string, not array) */}
      {textResults.length > 0 && (
        <div className="mb-2">
          {textResults.map((result, index) => (
            <TextClampMore
              key={`text-${index}`}
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
              lines={4}
            />
          ))}
        </div>
      )}
    </LightboxGallery>
  )
}
