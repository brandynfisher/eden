'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ToolHoverMenu } from '@/features/sessions/components/tool-hover-menu'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { TaskV2Args, TaskV2Result } from '@edenlabs/eden-sdk'
import { BotIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import React, { useMemo, useState } from 'react'

export type PromptAgentEmbedProps = {
  results: TaskV2Result[]
  toolName?: string
  toolArgs?: TaskV2Args
}

// Max characters for response preview before truncating
const RESPONSE_PREVIEW_MAX_LENGTH = 500

export const PromptAgentEmbed: React.FC<PromptAgentEmbedProps> = ({
  results,
  toolName,
  toolArgs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract agent username and response from results
  const { agentUsername, response } = useMemo(() => {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return { agentUsername: null, response: null }
    }

    for (const result of results) {
      // Check if result has output with agent and response fields
      if (result && result.output && typeof result.output === 'object') {
        // Handle array output
        if (Array.isArray(result.output)) {
          for (const item of result.output) {
            if (item && typeof item === 'object') {
              const obj = item as Record<string, unknown>
              if ('agent' in obj && 'response' in obj) {
                return {
                  agentUsername: obj.agent as string,
                  response: obj.response as string,
                }
              }
            }
          }
        } else {
          // Handle object output directly
          const output = result.output as unknown as Record<string, unknown>
          if ('agent' in output && 'response' in output) {
            return {
              agentUsername: output.agent as string,
              response: output.response as string,
            }
          }
        }
      }

      // Also check result directly (in case output is flattened)
      if (result && typeof result === 'object') {
        const obj = result as unknown as Record<string, unknown>
        if ('agent' in obj && 'response' in obj) {
          return {
            agentUsername: obj.agent as string,
            response: obj.response as string,
          }
        }
      }
    }

    return { agentUsername: null, response: null }
  }, [results])

  // Fetch agent details to get avatar
  const { agent, isLoading } = useAgentQuery({
    key: agentUsername || '',
    enabled: !!agentUsername,
  })

  // Handle content truncation
  const needsTruncation =
    response && response.length > RESPONSE_PREVIEW_MAX_LENGTH
  const displayResponse =
    response && needsTruncation && !isExpanded
      ? response.slice(0, RESPONSE_PREVIEW_MAX_LENGTH) + '...'
      : response

  // If no agent or response data, don't render
  if (!agentUsername || !response) {
    return null
  }

  // Get avatar URL
  const avatarUrl = agent?.userImage
    ? getCloudfrontOriginalUrl(agent.userImage)
    : undefined

  // Get display name
  const displayName = agent?.name || agentUsername

  return (
    <div className="space-y-2">
      {/* Agent response card */}
      <div className="rounded-lg border border-border/50 bg-card p-4">
        <div className="flex gap-3">
          {/* Agent avatar */}
          <Avatar className="w-10 h-10 border border-border shrink-0">
            {isLoading ? (
              <AvatarFallback className="text-sm animate-pulse">
                {agentUsername.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage
                  src={avatarUrl}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="text-sm">
                  {avatarUrl ? (
                    displayName.slice(0, 2).toUpperCase()
                  ) : (
                    <BotIcon className="w-5 h-5 text-muted-foreground" />
                  )}
                </AvatarFallback>
              </>
            )}
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Agent name */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{displayName}</span>
              {agent?.name &&
                agent.username &&
                agent.name !== agent.username && (
                  <span className="text-xs text-muted-foreground">
                    @{agent.username}
                  </span>
                )}
            </div>

            {/* Response text */}
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">
              {displayResponse}
            </p>

            {/* Expand/collapse button */}
            {needsTruncation && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUpIcon className="w-3 h-3" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="w-3 h-3" />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tool hover menu at bottom right */}
      {toolName && toolArgs && (
        <div className="flex justify-end">
          <ToolHoverMenu toolName={toolName} args={toolArgs} result={results} />
        </div>
      )}
    </div>
  )
}
