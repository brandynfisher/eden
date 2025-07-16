'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ExternalLink, Hash, MessageCircle, User } from 'lucide-react'
import React from 'react'

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
  const platformName =
    platform === 'discord'
      ? 'Discord'
      : platform === 'twitter'
      ? 'Twitter'
      : platform === 'farcaster'
      ? 'Farcaster'
      : platform

  const contentTypeLabel =
    contentType === 'search'
      ? 'Search Results'
      : contentType === 'mentions'
      ? 'Mentions'
      : contentType === 'trends'
      ? 'Trends'
      : contentType

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
          {result && result.output && Array.isArray(result.output) ? (
            <div className="space-y-2">
              {result.output.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="p-3 bg-accent/50 rounded-md border border-secondary hover:bg-accent/70 transition-colors"
                >
                  {/* Content text */}
                  {item.text && <div className="text-sm mb-2">{item.text}</div>}

                  {/* Author info */}
                  {item.author && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <User size={12} />
                      <span>@{item.author}</span>
                      {item.author_name && item.author_name !== item.author && (
                        <span>({item.author_name})</span>
                      )}
                    </div>
                  )}

                  {/* Discord specific fields */}
                  {item.channel_name && (
                    <div className="text-xs text-muted-foreground mb-2">
                      #{item.channel_name}
                    </div>
                  )}

                  {/* Timestamp */}
                  {item.timestamp && (
                    <div className="text-xs text-muted-foreground mb-2">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                  )}

                  {/* URL link */}
                  {item.url && (
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                      >
                        View on {platformName}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    {item.likes && <span>❤️ {item.likes}</span>}
                    {item.retweets && <span>🔄 {item.retweets}</span>}
                    {item.replies && <span>💬 {item.replies}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : result && result.output && typeof result.output === 'string' ? (
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
