'use client'

import DiscordIcon from '@/components/icons/discord'
import TwitterIcon from '@/components/icons/twitter'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { TaskV2Args, TaskV2Result } from '@edenlabs/eden-sdk'
import { ExternalLink } from 'lucide-react'
import React, { Component, ReactNode } from 'react'
import { Tweet } from 'react-tweet'

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
    | 'instagram'
  args?: TaskV2Args
}

// Extract tweet ID from Twitter/X URL
const extractTweetId = (url: string): string | null => {
  // Match twitter.com or x.com status URLs
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)
  return match ? match[1] : null
}

// Error boundary for Tweet component
class TweetErrorBoundary extends Component<
  { children: ReactNode; url: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; url: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Tweet embed error:', error, errorInfo)
  }

  componentDidUpdate(prevProps: { children: ReactNode; url: string }) {
    if (prevProps.url !== this.props.url && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
          <span className="text-sm text-muted-foreground">
            Tweet unavailable
          </span>
          <a
            href={this.props.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline block mt-1"
          >
            View on Twitter
          </a>
        </div>
      )
    }

    return this.props.children
  }
}

// Twitter post embed using react-tweet
const TwitterPostEmbed: React.FC<{ url: string }> = ({ url }) => {
  const tweetId = extractTweetId(url)

  if (!tweetId) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-md border border-secondary">
        <TwitterIcon size={16} className="text-blue-500" />
        <span className="text-sm text-muted-foreground">Posted to Twitter</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          Link
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <TwitterIcon size={12} className="text-blue-500" />
        Posted to Twitter:{' '}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          View on Twitter
        </a>
      </div>
      <TweetErrorBoundary url={url}>
        <div className="tweet-embed-wrapper">
          <Tweet id={tweetId} />
          <style jsx global>{`
            .tweet-embed-wrapper [data-theme] {
              background-color: hsl(0, 0%, 7%) !important;
            }
            .tweet-embed-wrapper .react-tweet-theme {
              background-color: hsl(0, 0%, 7%) !important;
            }
            .tweet-embed-wrapper,
            .tweet-embed-wrapper > div,
            .tweet-embed-wrapper .react-tweet-theme {
              width: 100% !important;
              max-width: 100% !important;
            }
          `}</style>
        </div>
      </TweetErrorBoundary>
    </div>
  )
}

// Helper to check if a URL is an image
const isImageUrl = (url: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.includes(ext))
}

// Helper to check if a URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi']
  const lowerUrl = url.toLowerCase()
  return videoExtensions.some(ext => lowerUrl.includes(ext))
}

// Discord post embed - Discord doesn't have official embeds, so we create a styled message preview
const DiscordPostEmbed: React.FC<{
  url: string
  content?: string
  mediaUrls?: string[]
}> = ({ url, content, mediaUrls }) => {
  // Normalize media URLs
  const normalizedMediaUrls = mediaUrls?.map(mediaUrl => {
    // If it's an Eden CDN URL, get the cloudfront version
    if (mediaUrl.includes('eden') || mediaUrl.includes('d14i3advvh2bvd')) {
      return getCloudfrontOriginalUrl(mediaUrl) || mediaUrl
    }
    return mediaUrl
  })

  return (
    <div className="overflow-hidden rounded-md border border-[#1e1f22] bg-[#313338] max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1e1f22]">
        <DiscordIcon size={20} />
        <span className="text-sm font-medium text-white">
          Posted to Discord
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1 text-xs text-[#00A8FC] hover:underline"
        >
          <span>View</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Message content */}
      <div className="px-3 py-3 space-y-3">
        {/* Text content */}
        {content && (
          <p className="text-sm text-[#dbdee1] whitespace-pre-wrap break-words">
            {content}
          </p>
        )}

        {/* Media grid */}
        {normalizedMediaUrls && normalizedMediaUrls.length > 0 && (
          <div
            className={`grid gap-1 ${
              normalizedMediaUrls.length === 1
                ? 'grid-cols-1'
                : normalizedMediaUrls.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2'
            }`}
          >
            {normalizedMediaUrls.map((mediaUrl, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-md bg-[#1e1f22]"
              >
                {isVideoUrl(mediaUrl) ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full max-h-[300px] object-contain"
                  />
                ) : isImageUrl(mediaUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl}
                    alt={`Attachment ${index + 1}`}
                    className="w-full max-h-[300px] object-contain"
                    loading="lazy"
                  />
                ) : (
                  // Fallback for unknown media types - try as image first
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl}
                    alt={`Attachment ${index + 1}`}
                    className="w-full max-h-[300px] object-contain"
                    loading="lazy"
                    onError={e => {
                      // If image fails, show a link instead
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement?.classList.add('p-3')
                      const link = document.createElement('a')
                      link.href = mediaUrl
                      link.target = '_blank'
                      link.className = 'text-[#00A8FC] text-sm hover:underline'
                      link.textContent = 'View attachment'
                      target.parentElement?.appendChild(link)
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show placeholder if no content */}
        {!content &&
          (!normalizedMediaUrls || normalizedMediaUrls.length === 0) && (
            <p className="text-sm text-[#949ba4] italic">Message sent</p>
          )}
      </div>
    </div>
  )
}

export const SocialPostEmbed: React.FC<SocialPostEmbedProps> = ({
  results,
  platform,
  args,
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
      : platform === 'instagram'
      ? 'Instagram'
      : platform

  const label =
    platform === 'email' ? 'Email sent' : `Posted to ${platformName}`

  // Extract content and media_urls from args for Discord
  // These are dynamic properties not in the TaskV2Args type definition
  const argsRecord = args as Record<string, unknown> | undefined
  const content = argsRecord?.content as string | undefined
  const mediaUrls = argsRecord?.media_urls as string[] | undefined

  // Handle case where results might not have the expected structure
  if (!results || !Array.isArray(results)) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    )
  }

  // Render platform-specific embeds for Twitter and Discord
  const renderOutput = (output: { url?: string }, outputIndex: number) => {
    if (!output || !output.url) {
      return (
        <div
          key={outputIndex}
          className="px-3 py-2 bg-accent rounded-md border border-secondary"
        >
          <span className="text-sm text-muted-foreground">
            {label} (no URL)
          </span>
        </div>
      )
    }

    // Twitter: use react-tweet embed
    if (platform === 'twitter') {
      return <TwitterPostEmbed key={outputIndex} url={output.url} />
    }

    // Discord: use styled message preview with content and media
    if (platform === 'discord') {
      return (
        <DiscordPostEmbed
          key={outputIndex}
          url={output.url}
          content={content}
          mediaUrls={mediaUrls}
        />
      )
    }

    // Default: simple link display for other platforms
    return (
      <div
        key={outputIndex}
        className="flex items-center gap-2 px-3 py-2 bg-accent rounded-md border border-secondary"
      >
        <span className="text-sm text-muted-foreground">{label}</span>
        <a
          href={output.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          Link
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((result, index) => (
        <div key={index} className="space-y-1">
          {result && result.output && Array.isArray(result.output) ? (
            result.output.map((output, outputIndex) =>
              renderOutput(output, outputIndex),
            )
          ) : result && result.output && typeof result.output === 'string' ? (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">{label}</span>
              <div className="text-sm mt-1 text-foreground/80">
                {result.output}
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
