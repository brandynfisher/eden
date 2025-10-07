'use client'

import { MarkdownText } from './markdown-text'
import React from 'react'

interface AssistantContentRendererProps {
  children: string
}

/**
 * Renders assistant message content with special handling for XML tags:
 * - Markdown content is rendered as markdown
 * - XML tags are rendered as code blocks (literal text)
 */
export const AssistantContentRenderer: React.FC<
  AssistantContentRendererProps
> = ({ children: content }) => {
  // Regular expression to match XML tags at the outermost level
  // This matches: <tag>content</tag> or <tag/>
  const xmlTagRegex =
    /<([a-zA-Z_][\w\-:.]*)[^>]*>[\s\S]*?<\/\1>|<[a-zA-Z_][\w\-:.]*[^>]*\/>/g

  const parts: Array<{ type: 'markdown' | 'xml'; content: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  // Find all XML tags and split content into markdown and XML parts
  while ((match = xmlTagRegex.exec(content)) !== null) {
    // Add markdown content before this XML tag
    if (match.index > lastIndex) {
      const markdownContent = content.substring(lastIndex, match.index)
      if (markdownContent.trim()) {
        parts.push({ type: 'markdown', content: markdownContent })
      }
    }

    // Add the XML tag
    parts.push({ type: 'xml', content: match[0] })
    lastIndex = match.index + match[0].length
  }

  // Add any remaining markdown content after the last XML tag
  if (lastIndex < content.length) {
    const markdownContent = content.substring(lastIndex)
    if (markdownContent.trim()) {
      parts.push({ type: 'markdown', content: markdownContent })
    }
  }

  // If no XML tags found, just render as markdown
  if (parts.length === 0) {
    return <MarkdownText>{content}</MarkdownText>
  }

  // Render mixed content
  return (
    <div className="space-y-2">
      {parts.map((part, index) => {
        if (part.type === 'markdown') {
          return (
            <div key={index}>
              <MarkdownText>{part.content}</MarkdownText>
            </div>
          )
        } else {
          // Render XML as code block
          return (
            <div
              key={index}
              className="bg-muted rounded-md border p-3 font-mono text-xs overflow-x-auto"
            >
              <pre className="whitespace-pre-wrap">{part.content}</pre>
            </div>
          )
        }
      })}
    </div>
  )
}
