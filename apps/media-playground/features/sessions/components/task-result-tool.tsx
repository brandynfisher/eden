'use client'

import ActionsDropdown from '@/components/button/actions-dropdown'
import CreationActionsMenu from '@/components/button/creations-actions-menu'
import DownloadActionItem from '@/components/button/download-action-item'
import ErrorBoundary from '@/components/error-boundary'
import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import TextClampMore from '@/components/text/text-clamp-more'
import { DropdownMenuGroup } from '@/components/ui/dropdown-menu'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { getFileTypeByMimeType } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { generateFilename } from '@/utils/slug.util'
import { TaskV2Status, ToolCall } from '@edenlabs/eden-sdk'
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'

export type TaskResultToolProps = {
  toolCall: ToolCall
}

// Simple download menu for media outputs without a creation
const MediaDownloadMenu = ({
  filename,
  mediaType = 'media',
  className,
}: {
  filename: string
  mediaType?: string
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ActionsDropdown className={className} onOpenChange={setIsOpen}>
      {isOpen && (
        <DropdownMenuGroup>
          <DownloadActionItem
            type="creation"
            originalFileUrl={filename}
            saveAsFileName={generateFilename(
              'Eden',
              mediaType,
              Date.now().toString(),
            )}
          />
        </DropdownMenuGroup>
      )}
    </ActionsDropdown>
  )
}

export const TaskResultTool: React.FC<TaskResultToolProps> = ({ toolCall }) => {
  const { tool, result: toolResults } = toolCall

  // Don't render cancelled tool calls
  if (toolCall.status === 'cancelled') {
    return null
  }

  return (
    <div className="mb-2 max-w-full">
      <ToolFallback
        type="tool-call"
        result={{
          tool: tool!,
          result: toolResults || [],
          status:
            toolCall.status === 'completed'
              ? TaskV2Status.Completed
              : toolCall.status === 'failed'
              ? TaskV2Status.Failed
              : toolCall.status === 'running'
              ? TaskV2Status.Running
              : TaskV2Status.Pending,
          error: toolCall.error,
        }}
        toolCallId={tool!}
        toolName={tool!}
        args={toolCall.args}
        argsText={JSON.stringify(toolCall.args)}
        status={
          toolCall.status === 'completed'
            ? { type: 'complete' }
            : toolCall.status === 'failed'
            ? { type: 'incomplete', reason: 'error' }
            : { type: 'running' }
        }
        addResult={() => true}
      />
      <ErrorBoundary>
        <LightboxGallery
        // galleryKey={tool}
        >
          <div
            className={cn([
              toolResults && toolResults.length > 1 && 'grid',
              'grid-cols-2 gap-2 md:gap-4 mt-4 mb-4',
            ])}
          >
            {toolResults
              ? toolResults.map((result, index) => (
                  <div className="relative" key={`${index}-${tool}`}>
                    {result && Array.isArray(result?.output) ? (
                      result.output.map((output, outputIndex) => (
                        <div
                          key={`${index}-${outputIndex}-${output.filename}`}
                          className="group"
                        >
                          {getFileTypeByMimeType(
                            output.mediaAttributes?.mimeType,
                          ) === 'audio' ? (
                            <audio
                              controls
                              // loop={true}
                              className="w-full max-w-2xl pr-12"
                            >
                              <source
                                src={getCloudfrontOriginalUrl(output.filename)}
                                type={output.mediaAttributes?.mimeType}
                              />
                            </audio>
                          ) : (
                            <div
                              draggable
                              onDragStart={(
                                e: React.DragEvent<HTMLDivElement>,
                              ) => {
                                const url = getCloudfrontOriginalUrl(
                                  output.filename,
                                )
                                e.dataTransfer.setData('text/plain', '') // Required for Firefox
                                e.dataTransfer.setData(
                                  'application/json',
                                  JSON.stringify({
                                    fileUrl: url,
                                    type:
                                      output.mediaAttributes?.mimeType ||
                                      'image/jpeg',
                                    name: url, // Use the full URL as the name
                                  }),
                                )
                                e.dataTransfer.effectAllowed = 'copy'
                              }}
                              className="relative w-full aspect-[16/9] min-h-[200px]"
                            >
                              <LightboxTrigger
                                className="absolute inset-0"
                                slide={{
                                  type: 'video',
                                  url:
                                    getCloudfrontOriginalUrl(output.filename) ||
                                    output.url ||
                                    '',
                                  thumbnail:
                                    getCloudfrontOriginalUrl(output.filename) ||
                                    output.url ||
                                    '',
                                  width: output.mediaAttributes?.width,
                                  height: output.mediaAttributes?.height,
                                  duration:
                                    output.mediaAttributes?.duration ||
                                    undefined,
                                  description:
                                    toolCall.args && toolCall.args.prompt
                                      ? String(toolCall.args.prompt)
                                      : undefined,
                                  title:
                                    toolCall.args && toolCall.args.prompt
                                      ? String(toolCall.args.prompt)
                                      : undefined,
                                }}
                                startIndex={index}
                                imageProps={{
                                  loading: 'lazy',
                                  blurhash: output.mediaAttributes?.blurhash,
                                  className: 'max-h-[420px]',
                                }}
                                videoProps={{
                                  className: 'max-h-[420px]',
                                }}
                              />
                            </div>
                          )}
                          {output.creation ? (
                            <CreationActionsMenu
                              creation={{
                                ...output.creation,
                                // @ts-expect-error faked taskv2
                                task: { args: toolCall.args },
                              }}
                              className="ml-auto z-20 absolute top-1 right-1 md:top-2 md:right-2 [@media(pointer:coarse)]:top-[-4px] [@media(pointer:coarse)]:h-7 [@media(pointer:coarse)]:right-[-4px] opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity [@media(pointer:coarse)]:opacity-100"
                              queryKey={['creations', output.creation?._id]}
                            />
                          ) : (
                            output.filename && (
                              <MediaDownloadMenu
                                filename={output.filename}
                                mediaType={getFileTypeByMimeType(
                                  output.mediaAttributes?.mimeType,
                                )}
                                className="ml-auto z-20 absolute top-1 right-1 md:top-2 md:right-2 [@media(pointer:coarse)]:top-[-4px] [@media(pointer:coarse)]:h-7 [@media(pointer:coarse)]:right-[-4px] opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity [@media(pointer:coarse)]:opacity-100"
                              />
                            )
                          )}
                        </div>
                      ))
                    ) : (
                      <div className=" px-4 p-2 bg-accent rounded-md border border-secondary">
                        <TextClampMore
                          text={
                            <ReactMarkdown>
                              {(result?.output as unknown as string) || ''}
                            </ReactMarkdown>
                          }
                          lines={3}
                        />
                      </div>
                    )}
                  </div>
                ))
              : null}
          </div>
        </LightboxGallery>
      </ErrorBoundary>
    </div>
  )
}
