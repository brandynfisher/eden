'use client'

import SessionCard from '@/components/session/session-card'
import { ToolMediaRenderer } from '@/features/sessions/tools/tool-media-renderer'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { TaskV2Result } from '@edenlabs/eden-sdk'
import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import React from 'react'

export type SessionPostEmbedProps = {
  results: TaskV2Result[]
}

export const SessionPostEmbed: React.FC<SessionPostEmbedProps> = ({
  results,
}) => {
  // Get the current session ID to fetch current session's agents
  const params = useParams()
  const currentSessionId = params?.id as string | undefined
  // Extract session ID from results
  // The result structure should have a session field with the session ID
  const sessionId = React.useMemo(() => {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return null
    }

    // Try to find session ID in various possible structures
    for (const result of results) {
      // Check if result has a session field directly
      if (result && typeof result === 'object' && 'session' in result) {
        const sessionValue = (result as { session?: string }).session
        if (typeof sessionValue === 'string') {
          return sessionValue
        }
      }

      // Check if result.output is a string (session ID)
      if (result && result.output && typeof result.output === 'string') {
        return result.output
      }

      // Check if result.output is an object with a session field
      if (result && result.output && typeof result.output === 'object') {
        if (Array.isArray(result.output)) {
          for (const output of result.output) {
            if (output && typeof output === 'object' && 'session' in output) {
              const sessionValue = (output as { session?: string }).session
              if (typeof sessionValue === 'string') {
                return sessionValue
              }
            }
          }
        } else if ('session' in result.output) {
          const sessionValue = (result.output as { session?: string }).session
          if (typeof sessionValue === 'string') {
            return sessionValue
          }
        }
      }
    }

    return null
  }, [results])

  // Filter out results that only contain the session ID (string outputs that are session IDs)
  // We want to show media outputs but not the session ID text
  // IMPORTANT: This must be before early returns to satisfy React hooks rules
  const mediaResults = React.useMemo(() => {
    return (
      results?.filter(result => {
        // Keep results with array outputs (media)
        if (result && Array.isArray(result?.output)) {
          return true
        }
        // Filter out string outputs that are session IDs
        // Session IDs are typically MongoDB ObjectIds (24 hex characters) or similar
        if (result && typeof result?.output === 'string') {
          const output = result.output as string
          // Don't render if it looks like a session ID (24 char hex string)
          if (/^[a-f0-9]{24}$/i.test(output)) {
            return false
          }
          // Keep other string outputs
          return true
        }
        // Keep other types of outputs
        return result && result?.output !== undefined
      }) || []
    )
  }, [results])

  // Fetch the posted session
  const { data: session, isLoading } = useSessionQuery({
    sessionId: sessionId || undefined,
    enabled: !!sessionId,
  })

  // Fetch the current session to get its agents
  const { data: currentSession } = useSessionQuery({
    sessionId: currentSessionId || undefined,
    enabled: !!currentSessionId,
  })

  const hasMediaOutputs = mediaResults.length > 0

  if (!sessionId) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">
          Posted to session (ID not found)
        </span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">
          Loading session...
        </span>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="px-3 py-2 bg-accent rounded-md border border-secondary">
        <span className="text-sm text-muted-foreground">
          Posted to session (session not found)
        </span>
      </div>
    )
  }

  // Get agent IDs from current session to hide them in the posted session card
  const currentAgentIds = currentSession?.agents?.map(agent => agent._id) || []

  // Construct chat link path: /chat/{agent_username}/{session_id}
  // Use the first agent's username if available
  const firstAgent = session.agents?.[0]
  const chatLinkPath = firstAgent?.username
    ? `/chat/${firstAgent.username}/${session._id}`
    : `/sessions/${session._id}` // fallback to sessions if no agent

  return (
    <div className="space-y-2">
      {/* Display media outputs first if they exist */}
      {hasMediaOutputs && <ToolMediaRenderer results={mediaResults} />}

      {/* Display session card */}
      <div className="text-sm text-muted-foreground mb-2">
        Posted to session:
      </div>
      <SessionCard
        session={session}
        hideAgentIds={currentAgentIds}
        linkPath={chatLinkPath}
      />
    </div>
  )
}
