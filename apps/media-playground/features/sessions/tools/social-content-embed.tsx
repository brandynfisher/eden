'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Hash,
  MessageCircle,
  User,
} from 'lucide-react'
import React, { useState } from 'react'

type SocialMessage = {
  content?: string
  text?: string
  author?: string
  author_name?: string
  channel_name?: string
  url?: string
  created_at?: string
  timestamp?: string
  likes?: number
  retweets?: number
  replies?: number
}

// Utility functions
const PLATFORM_NAMES = {
  discord: 'Discord',
  twitter: 'Twitter',
  farcaster: 'Farcaster',
} as const

const CONTENT_TYPE_LABELS = {
  search: 'Search Results',
  mentions: 'Mentions',
  trends: 'Trends',
} as const

const formatTimestamp = (
  dateValue: string | undefined,
  format: 'time' | 'date' | 'full',
): string => {
  if (!dateValue) return ''
  const date = new Date(dateValue)

  switch (format) {
    case 'time':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    case 'date':
      return date.toLocaleDateString()
    case 'full':
      return date.toLocaleString()
    default:
      return ''
  }
}

const getContentText = (item: SocialMessage): string => {
  return item.content || item.text || ''
}

const getTimestamp = (item: SocialMessage): string | undefined => {
  return item.created_at || item.timestamp
}

// Reusable components
const MessageMetrics: React.FC<{ item: SocialMessage }> = ({ item }) => {
  const hasMetrics = item.likes || item.retweets || item.replies

  if (!hasMetrics) return null

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
      {item.likes && <span>❤️ {item.likes}</span>}
      {item.retweets && <span>🔄 {item.retweets}</span>}
      {item.replies && <span>💬 {item.replies}</span>}
    </div>
  )
}

const AuthorInfo: React.FC<{ item: SocialMessage }> = ({ item }) => {
  if (!item.author) return null

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
      <User size={12} />
      <span>@{item.author}</span>
      {item.author_name && item.author_name !== item.author && (
        <span>({item.author_name})</span>
      )}
    </div>
  )
}

const MessageContent: React.FC<{ item: SocialMessage; className?: string }> = ({
  item,
  className = 'text-sm mb-2',
}) => {
  const content = getContentText(item)

  if (!content) return null

  return <div className={className}>{content}</div>
}

export type SocialContentEmbedProps = {
  results: TaskV2Result[]
  platform: 'discord' | 'twitter' | 'farcaster'
  contentType: 'search' | 'mentions' | 'trends'
}

export const SocialContentEmbed: React.FC<SocialContentEmbedProps> = ({
  results,
  platform,
  contentType,
}) => {
  // State for expand/collapse - moved to top to avoid conditional hook call
  const [isExpanded, setIsExpanded] = useState(false)

  const platformName = PLATFORM_NAMES[platform] || platform
  const contentTypeLabel = CONTENT_TYPE_LABELS[contentType] || contentType

  // Handle case where results might not have the expected structure
  if (!results || !Array.isArray(results) || results.length === 0) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">
          No {contentTypeLabel.toLowerCase()} found on {platformName}
        </span>
      </div>
    )
  }

  // Special handling for Discord search results - group messages into one card
  if (platform === 'discord' && contentType === 'search') {
    // Collect all messages from all results
    const allMessages: SocialMessage[] = []
    let channelName = ''
    let discordUrl = ''
    let messageDate = ''

    results.forEach(result => {
      if (result?.output && Array.isArray(result.output)) {
        result.output.forEach(item => {
          const typedItem = item as SocialMessage
          allMessages.push(typedItem)
          // Get channel name and URL from first message that has them
          if (!channelName && typedItem.channel_name) {
            channelName = typedItem.channel_name
          }
          if (!discordUrl && typedItem.url) {
            discordUrl = typedItem.url
          }
          // Get date from first message for header
          if (!messageDate) {
            const timestamp = getTimestamp(typedItem)
            if (timestamp) {
              messageDate = formatTimestamp(timestamp, 'date')
            }
          }
        })
      }
    })

    if (allMessages.length === 0) {
      return (
        <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
          <span className="text-sm text-muted-foreground">
            No {contentTypeLabel.toLowerCase()} found on {platformName}
          </span>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <div className="bg-accent/50 rounded-md border border-secondary hover:bg-accent/70 transition-colors">
          {/* Header with channel name, date, and Discord link - always visible */}
          <div
            className="flex items-center justify-between p-3 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="flex items-center gap-1">
                <Hash size={16} />
                <span>{channelName || 'discord'}</span>
              </div>
              {messageDate && (
                <span className="text-muted-foreground">{messageDate}</span>
              )}
              {discordUrl && (
                <a
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  onClick={e => e.stopPropagation()} // Prevent expand/collapse when clicking link
                >
                  View on Discord
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Expand/collapse button */}
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Expandable messages content */}
          {isExpanded && (
            <div className="px-3 pb-3 border-t border-secondary/50">
              <div className="space-y-2 mt-3">
                {allMessages.map((item, index) => (
                  <div key={index} className="text-sm">
                    {/* Discord-style message: username with time, content indented below */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.author && (
                          <span className="font-medium text-foreground">
                            @{item.author}:
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(getTimestamp(item), 'time')}
                        </span>
                      </div>
                      <MessageContent
                        item={item}
                        className="text-foreground/90 pl-4"
                      />
                    </div>
                    <MessageMetrics item={item} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Original behavior for non-Discord or non-search content
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {contentType === 'search' && <Hash size={16} />}
        {contentType === 'mentions' && <MessageCircle size={16} />}
        {contentType === 'trends' && <User size={16} />}
        <span>
          {platformName} {contentTypeLabel}
        </span>
      </div>

      {results.map((result, index) => (
        <div key={index} className="space-y-2">
          {result?.output && Array.isArray(result.output) ? (
            <div className="space-y-2">
              {result.output.map((item, itemIndex) => {
                const typedItem = item as SocialMessage
                return (
                  <div
                    key={itemIndex}
                    className="p-3 bg-accent/50 rounded-md border border-secondary hover:bg-accent/70 transition-colors"
                  >
                    <MessageContent item={typedItem} />
                    <AuthorInfo item={typedItem} />

                    {/* Discord specific fields */}
                    {typedItem.channel_name && (
                      <div className="text-xs text-muted-foreground mb-2">
                        #{typedItem.channel_name}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground mb-2">
                      {formatTimestamp(getTimestamp(typedItem), 'full')}
                    </div>

                    {/* URL link */}
                    {typedItem.url && (
                      <div className="flex items-center gap-2 mt-2">
                        <a
                          href={typedItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        >
                          View on {platformName}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <MessageMetrics item={typedItem} />
                  </div>
                )
              })}
            </div>
          ) : result?.output && typeof result.output === 'string' ? (
            <div className="p-3 bg-accent/50 rounded-md border border-secondary">
              <div className="text-sm">{result.output}</div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                {contentTypeLabel} from {platformName}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
