'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ExternalLink } from 'lucide-react'
import React from 'react'

export type CollectionAddedEmbedProps = {
  results: TaskV2Result[]
}

export const CollectionAddedEmbed: React.FC<CollectionAddedEmbedProps> = ({
  results,
}) => {
  // Handle case where results might not have the expected structure
  if (!results || !Array.isArray(results)) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">
          Added to collection
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
                  Added to collection
                </span>
                {output && (output as Record<string, unknown>).collection_id ? (
                  <a
                    href={`/collections/${
                      (output as Record<string, unknown>).collection_id
                    }`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    View collection
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : output && output.url ? (
                  <a
                    href={output.url}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    View collection
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    (no collection link)
                  </span>
                )}
              </div>
            ))
          ) : result && result.output && typeof result.output === 'string' ? (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Added to collection
              </span>
              <div className="text-sm mt-1 text-foreground/80">
                {result.output}
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
              <span className="text-sm text-muted-foreground">
                Added to collection
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
