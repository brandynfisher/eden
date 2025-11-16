'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import React from 'react'
import { FarcasterEmbed } from 'react-farcaster-embed/dist/client'

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
                  <FarcasterEmbed url={output.url} />
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
