'use client'

import CreationActionsMenu from '@/components/button/creations-actions-menu'
import ErrorBoundary from '@/components/error-boundary'
import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import TextClampMore from '@/components/text/text-clamp-more'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { getFileTypeByMimeType } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { makeAssistantToolUI } from '@assistant-ui/react'
import { TaskV2Result, TaskV2Status, ToolV2 } from '@edenlabs/eden-sdk'
import React from 'react'
import ReactMarkdown from 'react-markdown'

export type TaskResultToolArgs = {
  // result: {
  tool: ToolV2['key']
  result: TaskV2Result[]
  status: TaskV2Status
  error?: string
  // }
}

export const TaskResultTool = makeAssistantToolUI({
  toolName: 'task_result',
  render: ({ args, argsText, status, result }) => {
    const { tool, result: toolResults } = result as TaskResultToolArgs
    // console.log('args', args)

    return (
      <div className="mb-2">
        <ToolFallback
          type="tool-call"
          result={result}
          toolCallId={tool}
          toolName={tool}
          args={args}
          argsText={argsText}
          status={status}
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
                                className="w-full max-w-2xl"
                              >
                                <source
                                  src={getCloudfrontOriginalUrl(
                                    output.filename,
                                  )}
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
                                className="w-full h-full"
                              >
                                <LightboxTrigger
                                  className="w-full h-full"
                                  slide={{
                                    type: 'video',
                                    url: getCloudfrontOriginalUrl(
                                      output.filename,
                                    ),
                                    thumbnail: getCloudfrontOriginalUrl(
                                      output.filename,
                                    ),
                                    width: output.mediaAttributes?.width,
                                    height: output.mediaAttributes?.height,
                                    duration:
                                      output.mediaAttributes?.duration ||
                                      undefined,
                                    description:
                                      args && args.prompt
                                        ? String(args.prompt)
                                        : undefined,
                                    title:
                                      args && args.prompt
                                        ? String(tool)
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
                            {output.creation && (
                              <CreationActionsMenu
                                creation={{
                                  ...output.creation,
                                  // @ts-expect-error faked taskv2
                                  task: { args },
                                }}
                                className="ml-auto z-20 absolute top-1 right-1 md:top-2 md:right-2 [@media(pointer:coarse)]:top-[-4px] [@media(pointer:coarse)]:h-7 [@media(pointer:coarse)]:right-[-4px] opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity [@media(pointer:coarse)]:opacity-100"
                                queryKey={['creations', output.creation?._id]}
                              />
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
  },
})
