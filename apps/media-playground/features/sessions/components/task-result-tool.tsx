'use client'

import ErrorBoundary from '@/components/error-boundary'
import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import TextClampMore from '@/components/text/text-clamp-more'
import { SocialContentEmbed } from '@/features/chat/components/tools/social-content-embed'
import { SocialPostEmbed } from '@/features/chat/components/tools/social-post-embed'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { getFileTypeByMimeType } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { TaskV2Result, TaskV2Status, ToolCall } from '@edenlabs/eden-sdk'
import React from 'react'
import ReactMarkdown from 'react-markdown'

export type TaskResultToolProps = {
  toolCall: ToolCall
  onCancel?: () => void
}

// Social tools mapping
const SOCIAL_TOOLS = {
  // Post tools - use SocialPostEmbed
  POST_TOOLS: {
    discord_post: { platform: 'discord' as const },
    telegram_post: { platform: 'telegram' as const },
    tweet: { platform: 'twitter' as const },
    farcaster_cast: { platform: 'farcaster' as const },
    shopify: { platform: 'shopify' as const },
    printify: { platform: 'printify' as const },
  },

  // Content tools - use SocialContentEmbed
  CONTENT_TOOLS: {
    discord_search: {
      platform: 'discord' as const,
      contentType: 'search' as const,
    },
    twitter_search: {
      platform: 'twitter' as const,
      contentType: 'search' as const,
    },
    'Twitter Search': {
      platform: 'twitter' as const,
      contentType: 'search' as const,
    },
    farcaster_search: {
      platform: 'farcaster' as const,
      contentType: 'search' as const,
    },
    twitter_mentions: {
      platform: 'twitter' as const,
      contentType: 'mentions' as const,
    },
    'Twitter Mentions': {
      platform: 'twitter' as const,
      contentType: 'mentions' as const,
    },
    farcaster_mentions: {
      platform: 'farcaster' as const,
      contentType: 'mentions' as const,
    },
    twitter_trends: {
      platform: 'twitter' as const,
      contentType: 'trends' as const,
    },
  },
} as const

export const TaskResultTool: React.FC<TaskResultToolProps> = ({
  toolCall,
  onCancel,
}) => {
  const { tool, result: toolResults } = toolCall

  // Check tool type using mapping
  const postToolConfig =
    SOCIAL_TOOLS.POST_TOOLS[tool as keyof typeof SOCIAL_TOOLS.POST_TOOLS]
  const contentToolConfig =
    SOCIAL_TOOLS.CONTENT_TOOLS[tool as keyof typeof SOCIAL_TOOLS.CONTENT_TOOLS]

  const isSocialPost = !!postToolConfig
  const isSocialContent = !!contentToolConfig

  // Check if tool is completed with displayable results
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
    toolCall.status === 'completed' && hasDisplayableResults

  return (
    <div className="mb-2 max-w-full">
      <ErrorBoundary>
        {isSocialPost ? (
          // Handle social post results (Discord, Telegram, Tweet, Farcaster, Shopify, Printify)
          <div className="mb-2 relative group">
            <SocialPostEmbed
              results={toolResults || []}
              platform={postToolConfig?.platform || 'discord'}
            />
          </div>
        ) : isSocialContent ? (
          // Handle social content results (Search, Mentions, Trends)
          <div className="mb-2 relative group">
            <SocialContentEmbed
              results={toolResults || []}
              platform={contentToolConfig?.platform || 'discord'}
              contentType={contentToolConfig?.contentType || 'search'}
            />
          </div>
        ) : (
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
                                    url:
                                      getCloudfrontOriginalUrl(
                                        output.filename,
                                      ) ||
                                      output.url ||
                                      '',
                                    thumbnail:
                                      getCloudfrontOriginalUrl(
                                        output.filename,
                                      ) ||
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
                : toolCall.status === 'cancelled'
                ? 'cancelled'
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
              : toolCall.status === 'cancelled'
              ? { type: 'incomplete', reason: 'cancelled' }
              : { type: 'running' }
          }
          addResult={() => true}
          onCancel={onCancel}
        />
      )}
    </div>
  )
}
