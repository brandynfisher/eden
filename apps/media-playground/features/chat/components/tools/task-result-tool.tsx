'use client'

import ErrorBoundary from '@/components/error-boundary'
import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import TextClampMore from '@/components/text/text-clamp-more'
import { SocialPostEmbed } from '@/features/chat/components/tools/social-post-embed'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { TwitterEmbed } from '@/features/chat/components/tools/twitter-embed'
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

    // Check if this is a Twitter tool and handle it specially
    const isTwitterTool =
      tool === 'twitter_mentions' ||
      tool === 'twitter_search' ||
      tool?.includes('twitter')

    // Check if this is a social post tool (Discord, Telegram, Tweet, Farcaster)
    const isDiscordPost = tool === 'discord_post'
    const isTelegramPost = tool === 'telegram_post'
    const isTweetPost = tool === 'tweet'
    const isFarcasterPost = tool === 'farcaster_cast'
    const isSocialPost =
      isDiscordPost || isTelegramPost || isTweetPost || isFarcasterPost

    // Check if tool is completed with displayable results
    const { status: toolStatus } = result as TaskResultToolArgs
    const hasDisplayableResults =
      toolResults &&
      toolResults.length > 0 &&
      toolResults.some(
        result =>
          result &&
          (Array.isArray(result?.output) ||
            (typeof (result as TaskV2Result)?.output === 'string' &&
              (result as TaskV2Result)?.output.length > 0)),
      )
    const isCompletedWithResults =
      toolStatus === 'completed' && hasDisplayableResults

    return (
      <div className="mb-2">
        <ErrorBoundary>
          {isTwitterTool ? (
            // Handle Twitter tool results
            <div className="mb-2 relative group">
              {toolResults
                ? toolResults.map((result, index) => (
                    <div key={`${index}-${tool}`}>
                      {result && Array.isArray(result?.output) ? (
                        <TwitterEmbed mentions={result.output} />
                      ) : (
                        <div className="px-4 p-2 bg-accent rounded-md border border-secondary">
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
          ) : isSocialPost ? (
            // Handle social post results (Discord, Telegram, Tweet, Farcaster)
            <div className="mb-2 relative group">
              <SocialPostEmbed
                results={toolResults || []}
                platform={
                  isDiscordPost
                    ? 'discord'
                    : isTelegramPost
                    ? 'telegram'
                    : isTweetPost
                    ? 'twitter'
                    : isFarcasterPost
                    ? 'farcaster'
                    : 'discord' // fallback
                }
              />
            </div>
          ) : (
            // Handle other tool results (existing logic)
            <LightboxGallery
            // galleryKey={tool}
            >
              <div
                className={cn([
                  toolResults && toolResults.length > 1 && 'grid',
                  'grid-cols-2 gap-2 md:gap-4 mb-2',
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
                                  className="relative w-full aspect-[16/9] min-h-[200px]"
                                >
                                  <LightboxTrigger
                                    className="absolute inset-0"
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
                                      blurhash:
                                        output.mediaAttributes?.blurhash,
                                      className: 'max-h-[420px]',
                                    }}
                                    videoProps={{
                                      className: 'max-h-[420px]',
                                    }}
                                  />
                                </div>
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
          )}
        </ErrorBoundary>
        {!isCompletedWithResults && (
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
        )}
      </div>
    )
  },
})
