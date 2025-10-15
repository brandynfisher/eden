'use client'

import ErrorBoundary from '@/components/error-boundary'
import { LightboxGallery, LightboxTrigger } from '@/components/media/lightbox'
import TextClampMore from '@/components/text/text-clamp-more'
import { CollectionAddedEmbed } from '@/features/sessions/tools/collection-added-embed'
import { CovenantEmbed } from '@/features/sessions/tools/covenant-embed'
import { SeedEmbed } from '@/features/sessions/tools/seed-embed'
import { SessionPostEmbed } from '@/features/sessions/tools/session-post-embed'
import { SocialContentEmbed } from '@/features/sessions/tools/social-content-embed'
import { SocialPostEmbed } from '@/features/sessions/tools/social-post-embed'
import { ToolFallback } from '@/features/sessions/tools/tool-fallback'
import { WebSearchCitations } from '@/features/sessions/tools/web-search-citations'
import { getFileTypeByMimeType } from '@/lib/files'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import {
  TaskV2Result,
  TaskV2Status,
  TasksV2ResultOutput,
  ToolCall,
} from '@edenlabs/eden-sdk'
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
    tiktok_post: { platform: 'tiktok' as const },
  },

  // Session post tools - use SessionPostEmbed
  SESSION_POST_TOOLS: {
    session_post: {},
    abraham_publish: {},
    abraham_daily: {},
  },

  // Covenant tools - use CovenantEmbed
  COVENANT_TOOLS: {
    abraham_covenant: {},
  },

  // Seed tools - use SeedEmbed
  SEED_TOOLS: {
    abraham_seed: {},
  },

  // Collection tools - use CollectionAddedEmbed
  COLLECTION_TOOLS: {
    add_to_collection: { platform: 'collection' as const },
  },

  // Web search tools - use custom rendering
  WEB_SEARCH_TOOLS: {
    web_search: { platform: 'web' as const },
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
  const sessionPostToolConfig =
    SOCIAL_TOOLS.SESSION_POST_TOOLS[
      tool as keyof typeof SOCIAL_TOOLS.SESSION_POST_TOOLS
    ]
  const covenantToolConfig =
    SOCIAL_TOOLS.COVENANT_TOOLS[
      tool as keyof typeof SOCIAL_TOOLS.COVENANT_TOOLS
    ]
  const seedToolConfig =
    SOCIAL_TOOLS.SEED_TOOLS[tool as keyof typeof SOCIAL_TOOLS.SEED_TOOLS]
  const contentToolConfig =
    SOCIAL_TOOLS.CONTENT_TOOLS[tool as keyof typeof SOCIAL_TOOLS.CONTENT_TOOLS]
  const collectionToolConfig =
    SOCIAL_TOOLS.COLLECTION_TOOLS[
      tool as keyof typeof SOCIAL_TOOLS.COLLECTION_TOOLS
    ]
  const webSearchToolConfig =
    SOCIAL_TOOLS.WEB_SEARCH_TOOLS[
      tool as keyof typeof SOCIAL_TOOLS.WEB_SEARCH_TOOLS
    ]

  const isSocialPost = !!postToolConfig
  const isSessionPost = !!sessionPostToolConfig
  const isCovenantTool = !!covenantToolConfig
  const isSeedTool = !!seedToolConfig
  const isSocialContent = !!contentToolConfig
  const isCollectionTool = !!collectionToolConfig
  const isWebSearchTool = !!webSearchToolConfig

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
          // Handle social post results (Discord, Telegram, Tweet, Farcaster, Shopify, Printify, TikTok)
          <div className="mb-2 relative group">
            <SocialPostEmbed
              results={toolResults || []}
              platform={postToolConfig?.platform || 'discord'}
            />
          </div>
        ) : isSessionPost ? (
          // Handle session post results (abraham_publish, session_post, abraham_daily)
          <div className="mb-2 relative group">
            <SessionPostEmbed results={toolResults || []} />
          </div>
        ) : isCovenantTool ? (
          // Handle covenant results (abraham_covenant)
          <div className="mb-2 relative group">
            <CovenantEmbed results={toolResults || []} />
          </div>
        ) : isSeedTool ? (
          // Handle seed results (abraham_seed)
          <div className="mb-2 relative group">
            <SeedEmbed results={toolResults || []} />
          </div>
        ) : isCollectionTool ? (
          // Handle collection tool results
          <div className="mb-2 relative group">
            <CollectionAddedEmbed results={toolResults || []} />
          </div>
        ) : isWebSearchTool && toolCall.status === 'completed' ? (
          // Handle web search tool results - only show when completed
          <div className="mb-2 relative group">
            <WebSearchCitations results={toolResults || []} />
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
          (() => {
            // Flatten all media outputs from all results
            const allMediaOutputs =
              toolResults?.flatMap((result, resultIndex) =>
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
                getFileTypeByMimeType(item.output.mediaAttributes?.mimeType) ===
                'audio',
            )
            const visualOutputs = allMediaOutputs.filter(
              item =>
                getFileTypeByMimeType(item.output.mediaAttributes?.mimeType) !==
                'audio',
            )

            // Text-only results
            const textResults =
              toolResults?.filter(result => !Array.isArray(result?.output)) ||
              []

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
                  outputs.reduce(
                    (sum, item) => sum + getAspectRatio(item.output),
                    0,
                  ) / count
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
                            const url = getCloudfrontOriginalUrl(
                              item.output.filename,
                            )
                            e.dataTransfer.setData('text/plain', '')
                            e.dataTransfer.setData(
                              'application/json',
                              JSON.stringify({
                                fileUrl: url,
                                type:
                                  item.output.mediaAttributes?.mimeType ||
                                  'image/jpeg',
                                name: url,
                              }),
                            )
                            e.dataTransfer.effectAllowed = 'copy'
                          }}
                          className={cn(
                            'relative w-full',
                            layout.itemClasses[index],
                          )}
                        >
                          <LightboxTrigger
                            className="absolute inset-0"
                            slide={{
                              type: 'video',
                              url:
                                getCloudfrontOriginalUrl(
                                  item.output.filename,
                                ) ||
                                item.output.url ||
                                '',
                              thumbnail:
                                getCloudfrontOriginalUrl(
                                  item.output.filename,
                                ) ||
                                item.output.url ||
                                '',
                              width: item.output.mediaAttributes?.width,
                              height: item.output.mediaAttributes?.height,
                              duration:
                                item.output.mediaAttributes?.duration ||
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
          })()
        )}
      </ErrorBoundary>
      {!isCompletedWithResults &&
        !(isWebSearchTool && toolCall.status === 'completed') && (
          <ToolFallback
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
                  ? TaskV2Status.Cancelled
                  : TaskV2Status.Pending,
              error: toolCall.error,
            }}
            toolName={tool!}
            args={toolCall.args}
            onCancel={onCancel}
          />
        )}
    </div>
  )
}
