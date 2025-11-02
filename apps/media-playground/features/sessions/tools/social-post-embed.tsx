'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ExternalLink } from 'lucide-react'
import React from 'react'

export type SocialPostEmbedProps = {
  results: TaskV2Result[]
  platform:
    | 'discord'
    | 'telegram'
    | 'twitter'
    | 'farcaster'
    | 'shopify'
    | 'printify'
    | 'tiktok'
    | 'email'
}

export const SocialPostEmbed: React.FC<SocialPostEmbedProps> = ({
  results,
  platform,
}) => {
  const platformName =
    platform === 'discord'
      ? 'Discord'
      : platform === 'telegram'
      ? 'Telegram'
      : platform === 'twitter'
      ? 'Twitter'
      : platform === 'farcaster'
      ? 'Farcaster'
      : platform === 'shopify'
      ? 'Shopify'
      : platform === 'printify'
      ? 'Printify'
      : platform === 'tiktok'
      ? 'TikTok'
      : platform === 'email'
      ? 'Email'
      : platform

  // Handle case where results might not have the expected structure
  if (!results || !Array.isArray(results)) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">
          Posted to {platformName}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((result, index) => (
        <div key={index} className="space-y-1">
          {result && result.output && Array.isArray(result.output) ? (
            result.output.map((output, outputIndex) => (
              <div
                key={outputIndex}
                className="flex items-center gap-2 px-3 py-2 bg-accent rounded-md border border-secondary"
              >
                <span className="text-sm text-muted-foreground">
                  Posted to {platformName}
                </span>
                {output && output.url ? (
                  <a
                    href={output.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Link
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    (no URL)
                  </span>
                )}
              </div>
            ))
          ) : result && result.output && typeof result.output === 'string' ? (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Posted to {platformName}
              </span>
              <div className="text-sm mt-1 text-foreground/80">
                {result.output}
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Posted to {platformName}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
