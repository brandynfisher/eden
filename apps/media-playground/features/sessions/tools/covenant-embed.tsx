'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ExternalLink } from 'lucide-react'
import React from 'react'

export type CovenantEmbedProps = {
  results: TaskV2Result[]
}

export const CovenantEmbed: React.FC<CovenantEmbedProps> = ({ results }) => {
  // Handle case where results might not have the expected structure
  if (!results || !Array.isArray(results)) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">
          Covenant published
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
                  Covenant published on blockchain
                </span>
                {output &&
                typeof output === 'object' &&
                'explorer_url' in output ? (
                  <a
                    href={(output as { explorer_url?: string }).explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    (no explorer URL)
                  </span>
                )}
              </div>
            ))
          ) : result && result.output && typeof result.output === 'string' ? (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Covenant published on blockchain
              </span>
              <div className="text-sm mt-1 text-foreground/80">
                {result.output}
              </div>
            </div>
          ) : result &&
            result.output &&
            typeof result.output === 'object' &&
            'explorer_url' in result.output ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Covenant published on blockchain
              </span>
              <a
                href={(result.output as { explorer_url?: string }).explorer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ) : (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Covenant published on blockchain
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
