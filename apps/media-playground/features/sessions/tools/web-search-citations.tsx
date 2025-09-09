'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import React from 'react'

export type WebSearchCitationsProps = {
  results: TaskV2Result[]
}

export const WebSearchCitations: React.FC<WebSearchCitationsProps> = ({
  results,
}) => {
  // Extract citations from results
  const citations: Array<{ title: string; url: string }> = []

  if (results && Array.isArray(results)) {
    results.forEach(result => {
      // Check if result itself has title and url (direct structure)
      const directItem = result as unknown as { title?: string; url?: string }
      if (directItem && directItem.title && directItem.url) {
        citations.push({
          title: directItem.title,
          url: directItem.url,
        })
      }
      // Also check if result has an output array (nested structure)
      else if (result && Array.isArray(result.output)) {
        result.output.forEach((item: unknown) => {
          const citationItem = item as { title?: string; url?: string }
          if (citationItem && citationItem.title && citationItem.url) {
            citations.push({
              title: citationItem.title,
              url: citationItem.url,
            })
          }
        })
      }
    })
  }

  if (citations.length === 0) {
    return (
      <div className="px-3 py-2 bg-muted/20 rounded-md border border-muted-foreground/10">
        <span className="text-xs text-muted-foreground">
          No citations available
        </span>
      </div>
    )
  }

  // Get favicon URL for a given website URL
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname
      // Using Google's favicon service - fast and reliable
      // Alternative: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
      // Alternative: `https://icons.duckduckgo.com/ip3/${domain}.ico`
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`
    } catch {
      return null
    }
  }

  // Get domain name for display
  const getDomainName = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return domain.replace('www.', '')
    } catch {
      return ''
    }
  }

  return (
    <div className="space-y-1">
      <div className="space-y-1">
        {citations.map((citation, index) => (
          <a
            key={`${index}-${citation.url}`}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-muted/20 rounded-md border border-muted-foreground/10 hover:bg-muted/30 transition-colors group"
          >
            {/* Favicon */}
            <img
              src={getFaviconUrl(citation.url) || ''}
              alt=""
              className="w-4 h-4 flex-shrink-0 rounded-sm"
              onError={e => {
                // Hide broken images
                e.currentTarget.style.display = 'none'
              }}
            />

            {/* Title */}
            <span className="flex-1 text-xs text-muted-foreground line-clamp-1 group-hover:text-foreground/70 transition-colors">
              {citation.title}
            </span>

            {/* Domain on the right */}
            <span className="text-xs text-muted-foreground/50 flex-shrink-0">
              {getDomainName(citation.url)}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
