'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ExternalLink } from 'lucide-react'
import React from 'react'

export type SeedEmbedProps = {
  results: TaskV2Result[]
}

export const SeedEmbed: React.FC<SeedEmbedProps> = ({ results }) => {
  // Handle case where results might not have the expected structure
  if (!results || !Array.isArray(results)) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">Seed created</span>
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
                  Seed created on Abraham
                </span>
                {output && typeof output === 'object' && 'url' in output ? (
                  <a
                    href={(output as { url?: string }).url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    View Seed
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    (no URL available)
                  </span>
                )}
              </div>
            ))
          ) : result && result.output && typeof result.output === 'string' ? (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Seed created on Abraham
              </span>
              <div className="text-sm mt-1 text-foreground/80">
                {result.output}
              </div>
            </div>
          ) : result &&
            result.output &&
            typeof result.output === 'object' &&
            'url' in result.output ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Seed created on Abraham
              </span>
              <a
                href={(result.output as { url?: string }).url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                View Seed
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Seed created on Abraham
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
