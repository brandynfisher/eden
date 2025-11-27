'use client'

import ErrorBoundary from '@/components/error-boundary'
import { CollectionAddedEmbed } from '@/features/sessions/tools/collection-added-embed'
import { CovenantEmbed } from '@/features/sessions/tools/covenant-embed'
import { FarcasterCastEmbed } from '@/features/sessions/tools/farcaster-cast-embed'
import { SeedEmbed } from '@/features/sessions/tools/seed-embed'
import { SessionPostEmbed } from '@/features/sessions/tools/session-post-embed'
import { SocialContentEmbed } from '@/features/sessions/tools/social-content-embed'
import { SocialPostEmbed } from '@/features/sessions/tools/social-post-embed'
import { ToolFallback } from '@/features/sessions/tools/tool-fallback'
import { ToolMediaRenderer } from '@/features/sessions/tools/tool-media-renderer'
import { WebSearchCitations } from '@/features/sessions/tools/web-search-citations'
import { TaskV2Status, ToolCall } from '@edenlabs/eden-sdk'
import React, { useMemo } from 'react'

export type TaskResultToolProps = {
  toolCall: ToolCall
  onCancel?: () => void
  /** If provided, clicking a child session card will call this instead of navigating */
  onSessionClick?: (sessionId: string) => void
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
    email_send: { platform: 'email' as const },
  },

  // Session post tools - use SessionPostEmbed
  SESSION_POST_TOOLS: {
    session_post: {},
    abraham_publish: {},
    verdelis_story: {},
    abraham_daily: {},
    media_editor: {},
    post_to_chatroom: {},
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
  onSessionClick,
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

  const isFarcasterCast = tool === 'farcaster_cast'
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
          (typeof result?.output === 'string' &&
            (result?.output as string).length > 0)),
    )

  // Memoize the result object to prevent infinite re-renders
  const toolFallbackResult = useMemo(
    () => ({
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
      task: toolCall.task,
    }),
    [tool, toolResults, toolCall.status, toolCall.error, toolCall.task],
  )

  return (
    <div className="mb-2 max-w-full">
      <ErrorBoundary>
        {isFarcasterCast ? (
          // Handle Farcaster cast with embedded preview
          <div className="mb-2 relative group">
            <FarcasterCastEmbed results={toolResults || []} />
          </div>
        ) : isSocialPost ? (
          // Handle social post results (Discord, Telegram, Tweet, Shopify, Printify, TikTok)
          <div className="mb-2 relative group">
            <SocialPostEmbed
              results={toolResults || []}
              platform={postToolConfig?.platform || 'discord'}
            />
          </div>
        ) : isSessionPost ? (
          // Handle session post results (abraham_publish, session_post, abraham_daily)
          <div className="mb-2 relative group">
            <SessionPostEmbed
              results={toolResults || []}
              childSessionId={toolCall.child_session}
              toolStatus={toolCall.status}
              onCancel={onCancel}
              toolName={tool}
              toolArgs={toolCall.args}
              error={toolCall.error}
              onSessionClick={onSessionClick}
            />
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
        ) : toolCall.child_session ? (
          // If tool has a child_session but isn't a SESSION_POST_TOOLS, show session (which includes media)
          <SessionPostEmbed
            results={toolResults || []}
            childSessionId={toolCall.child_session}
            toolStatus={toolCall.status}
            onCancel={onCancel}
            toolName={tool}
            toolArgs={toolCall.args}
            onSessionClick={onSessionClick}
          />
        ) : (
          <ToolMediaRenderer results={toolResults || []} args={toolCall.args} />
        )}
      </ErrorBoundary>
      {/* Show ToolFallback only when there are no displayable results */}
      {!hasDisplayableResults &&
        !(isWebSearchTool && toolCall.status === 'completed') &&
        !isSessionPost &&
        !toolCall.child_session && (
          <ToolFallback
            result={toolFallbackResult}
            toolName={tool!}
            args={toolCall.args}
            onCancel={onCancel}
          />
        )}
    </div>
  )
}
