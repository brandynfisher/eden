'use client'

import 'react-farcaster-embed/dist/styles.css'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import React, { Component, ReactNode } from 'react'
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client'

// Error boundary that catches all errors including async ones
class FarcasterEmbedErrorBoundary extends Component<
  { children: ReactNode; url: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; url: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('FarcasterEmbed error:', error, errorInfo)
  }

  componentDidUpdate(prevProps: { children: ReactNode; url: string }) {
    // Reset error state when URL changes
    if (prevProps.url !== this.props.url && this.state.hasError) {
      this.setState({ hasError: false, error: null })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
          <span className="text-sm text-muted-foreground">
            Cast unavailable (may have been deleted)
          </span>
          <a
            href={this.props.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline block mt-1"
          >
            View on Warpcast
          </a>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component with error tracking
const SafeFarcasterEmbed: React.FC<{ url: string }> = ({ url }) => {
  const [hasError, setHasError] = React.useState(false)
  const errorCaughtRef = React.useRef(false)

  React.useEffect(() => {
    // Reset error state when URL changes
    setHasError(false)
    errorCaughtRef.current = false

    // Set up promise rejection handler for this specific cast
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || ''

      // Check if this error is related to fetching a cast
      if (
        errorMessage.includes('Unable to fetch cast') &&
        !errorCaughtRef.current
      ) {
        errorCaughtRef.current = true
        setHasError(true)
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleRejection)

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [url])

  if (hasError) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">
          Cast unavailable (may have been deleted)
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline block mt-1"
        >
          View on Warpcast
        </a>
      </div>
    )
  }

  return (
    <FarcasterEmbedErrorBoundary url={url}>
      <FarcasterEmbed url={url} />
    </FarcasterEmbedErrorBoundary>
  )
}

export type FarcasterCastEmbedProps = {
  results: TaskV2Result[]
}

export const FarcasterCastEmbed: React.FC<FarcasterCastEmbedProps> = ({
  results,
}) => {
  // Handle case where results might not have the expected structure
  if (!results || !Array.isArray(results)) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">
          Posted to Farcaster
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
              <div key={outputIndex} className="w-full">
                {output && output.url ? (
                  <SafeFarcasterEmbed key={output.url} url={output.url} />
                ) : (
                  <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
                    <span className="text-sm text-muted-foreground">
                      Posted to Farcaster (no URL)
                    </span>
                  </div>
                )}
              </div>
            ))
          ) : result && result.output && typeof result.output === 'string' ? (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Posted to Farcaster
              </span>
              <div className="text-sm mt-1 text-foreground/80">
                {result.output}
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Posted to Farcaster
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
