'use client'

import { TaskV2Result } from '@edenlabs/eden-sdk'
import { Code } from 'lucide-react'
import React, { useState } from 'react'

const JSON_CONTENT_LIMIT = 500

export type JsonResultEmbedProps = {
  results: TaskV2Result[]
  toolName: string
}

export const JsonResultEmbed: React.FC<JsonResultEmbedProps> = ({
  results,
  toolName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract and stringify the result output
  const getJsonContent = (): string => {
    if (!results || results.length === 0) {
      return '{}'
    }

    // Try to extract meaningful content from results
    const outputData = results.map(result => {
      if (result?.output) {
        return result.output
      }
      return result
    })

    // If single result, don't wrap in array
    const dataToStringify = outputData.length === 1 ? outputData[0] : outputData

    try {
      return JSON.stringify(dataToStringify, null, 2)
    } catch {
      return String(dataToStringify)
    }
  }

  const fullContent = getJsonContent()
  const needsTruncation = fullContent.length > JSON_CONTENT_LIMIT
  const displayContent =
    needsTruncation && !isExpanded
      ? fullContent.slice(0, JSON_CONTENT_LIMIT) + '...'
      : fullContent

  // Format tool name for display
  const displayToolName = toolName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())

  return (
    <div className="overflow-hidden rounded-md border border-secondary bg-accent max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-secondary bg-secondary/30">
        <Code size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {displayToolName} Result
        </span>
      </div>

      {/* JSON content */}
      <div className="px-3 py-3">
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words overflow-x-auto">
          {displayContent}
        </pre>
        {needsTruncation && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-xs text-blue-500 hover:underline"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    </div>
  )
}
