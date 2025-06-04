'use client'

import TwitterIcon from '@/components/icons/twitter'
import React from 'react'
import { Tweet } from 'react-tweet'

interface TwitterMention {
  id: string
  text: string
  author_id: string
  created_at?: string | null
  url: string
}

interface TwitterEmbedProps {
  mentions: unknown[]
}

// Type guard to check if an object is a valid Twitter mention
const isTwitterMention = (obj: unknown): obj is TwitterMention => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'text' in obj &&
    'author_id' in obj &&
    'url' in obj &&
    typeof (obj as Record<string, unknown>).id === 'string' &&
    typeof (obj as Record<string, unknown>).text === 'string' &&
    typeof (obj as Record<string, unknown>).author_id === 'string' &&
    typeof (obj as Record<string, unknown>).url === 'string'
  )
}

const TwitterMentionEmbed = ({ mention }: { mention: TwitterMention }) => {
  return (
    <div className="twitter-mention-wrapper">
      <Tweet id={mention.id} />

      <style jsx global>{`
        .twitter-mention-wrapper [data-theme] {
          background-color: hsl(0, 0%, 7%) !important;
        }

        .twitter-mention-wrapper .react-tweet-theme {
          background-color: hsl(0, 0%, 7%) !important;
        }

        .twitter-mention-wrapper,
        .twitter-mention-wrapper > div,
        .twitter-mention-wrapper .react-tweet-theme {
          width: 100% !important;
          max-width: 100% !important;
        }
      `}</style>
    </div>
  )
}

export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({ mentions }) => {
  // Filter and validate Twitter mentions
  const validMentions = mentions.filter(isTwitterMention)

  if (!validMentions || validMentions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No posts found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <TwitterIcon size={16} className="text-blue-500" />
        <span>
          {validMentions.length} Twitter mention
          {validMentions.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-4">
        {validMentions.map(mention => (
          <TwitterMentionEmbed key={mention.id} mention={mention} />
        ))}
      </div>
    </div>
  )
}
