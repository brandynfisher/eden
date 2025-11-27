'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import InlineSessionCard from '@/components/session/inline-session-card'
import TextClampMore from '@/components/text/text-clamp-more'
import { AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ToolHoverMenu } from '@/features/sessions/components/tool-hover-menu'
import { ToolMediaRenderer } from '@/features/sessions/tools/tool-media-renderer'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { TaskV2Args, TaskV2Result, TaskV2Status } from '@edenlabs/eden-sdk'
import { XIcon } from 'lucide-react'
import { useParams } from 'next/navigation'
import React from 'react'

export type SessionPostEmbedProps = {
  results: TaskV2Result[]
  childSessionId?: string
  toolStatus?: TaskV2Status | string | null
  onCancel?: () => void
  toolName?: string
  toolArgs?: TaskV2Args
  error?: string
  /** If provided, clicking the session card will call this instead of navigating */
  onSessionClick?: (sessionId: string) => void
}

export const SessionPostEmbed: React.FC<SessionPostEmbedProps> = ({
  results,
  childSessionId,
  toolStatus,
  onCancel,
  toolName,
  toolArgs,
  error,
  onSessionClick,
}) => {
  // Get the current session ID to fetch current session's agents
  const params = useParams()
  const currentSessionId = params?.id as string | undefined

  // Extract session ID from results or use the provided childSessionId
  // The result structure should have a session field with the session ID
  // Also supports posted_to_session from post_to_chatroom tool
  const sessionId = React.useMemo(() => {
    // If childSessionId is provided, use it directly
    if (childSessionId) {
      return childSessionId
    }
    if (!results || !Array.isArray(results) || results.length === 0) {
      return null
    }

    // Helper to extract session ID from an object (checks both 'session' and 'posted_to_session')
    const extractSessionId = (obj: Record<string, unknown>): string | null => {
      // Check for session field
      if ('session' in obj && typeof obj.session === 'string') {
        return obj.session
      }
      // Check for posted_to_session field (from post_to_chatroom)
      if ('posted_to_session' in obj) {
        const posted = obj.posted_to_session
        // posted_to_session can be a string ID or a Session object with _id
        if (typeof posted === 'string') {
          return posted
        }
        if (posted && typeof posted === 'object' && '_id' in posted) {
          return (posted as { _id: string })._id
        }
      }
      return null
    }

    // Try to find session ID in various possible structures
    for (const result of results) {
      // Check if result has a session/posted_to_session field directly
      if (result && typeof result === 'object') {
        const sessionValue = extractSessionId(result as Record<string, unknown>)
        if (sessionValue) {
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
            if (output && typeof output === 'object') {
              const sessionValue = extractSessionId(
                output as Record<string, unknown>,
              )
              if (sessionValue) {
                return sessionValue
              }
            }
          }
        } else {
          const sessionValue = extractSessionId(
            result.output as Record<string, unknown>,
          )
          if (sessionValue) {
            return sessionValue
          }
        }
      }
    }

    return null
  }, [results, childSessionId])

  // Filter out results that only contain the session ID (string outputs that are session IDs)
  // We want to show media outputs but not the session ID text
  // IMPORTANT: This must be before early returns to satisfy React hooks rules
  const mediaResults = React.useMemo(() => {
    return (
      results?.filter(result => {
        // Check if result has array outputs
        if (result && Array.isArray(result?.output)) {
          // Filter out arrays that only contain session objects
          const hasActualMedia = result.output.some(item => {
            if (!item || typeof item !== 'object') return false
            // Check if it's a media object (has filename or mediaAttributes)
            return (
              'filename' in item || 'mediaAttributes' in item || 'url' in item
            )
          })
          return hasActualMedia
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
        // Filter out object outputs that only contain a session field
        if (
          result &&
          result?.output &&
          typeof result.output === 'object' &&
          !Array.isArray(result.output)
        ) {
          const output = result.output as Record<string, unknown>
          // If it's an object with only a 'session' or 'posted_to_session' field, filter it out
          const keys = Object.keys(output)
          if (
            keys.length === 1 &&
            (keys[0] === 'session' || keys[0] === 'posted_to_session')
          ) {
            return false
          }
          // Also filter out if it only has posted_to_session and maybe a message field (post_to_chatroom result)
          if (keys.length <= 2 && keys.includes('posted_to_session')) {
            return false
          }
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

  // Extract error from results if it exists in the output
  const resultError = React.useMemo(() => {
    if (!results || !Array.isArray(results) || results.length === 0) {
      return null
    }

    // Check if any result has an error field
    for (const result of results) {
      if (result && typeof result === 'object') {
        // Check if result.output is an object with an error field
        if (result.output && typeof result.output === 'object') {
          if ('error' in result.output) {
            const errorValue = (result.output as { error?: string }).error
            if (typeof errorValue === 'string') {
              return errorValue
            }
          }
        }
        // Check if result itself has an error field
        if ('error' in result) {
          const errorValue = (result as { error?: string }).error
          if (typeof errorValue === 'string') {
            return errorValue
          }
        }
      }
    }

    return null
  }, [results])

  // Use error from prop or from results
  const displayError = error || resultError

  // If no session ID but we have media outputs, just show the media
  if (!sessionId && hasMediaOutputs) {
    return (
      <>
        <ToolMediaRenderer results={mediaResults} args={toolArgs} />
        {/* Display error if present */}
        {displayError && (
          <div className="mt-2">
            <AlertDestructive title="Tool Call failed">
              <AlertDescription>
                <TextClampMore text={displayError} lines={3} />
              </AlertDescription>
            </AlertDestructive>
          </div>
        )}
      </>
    )
  }

  // If no session ID and no media outputs, check if we should display error
  if (!sessionId) {
    // If we have an error, display it
    if (displayError) {
      return (
        <div className="mt-2">
          <AlertDestructive title="Tool Call failed">
            <AlertDescription>
              <TextClampMore text={displayError} lines={3} />
            </AlertDescription>
          </AlertDestructive>
        </div>
      )
    }
    // Otherwise don't render anything
    return null
  }

  // If loading or session not found, don't render anything
  if (isLoading || !session) {
    return null
  }

  // Get agent IDs from current session to hide them in the posted session card
  const currentAgentIds = currentSession?.agents?.map(agent => agent._id) || []

  // Link to the session
  const chatLinkPath = `/sessions/${session._id}`

  // Check if tool is running
  const isRunning =
    toolStatus === TaskV2Status.Running || toolStatus === TaskV2Status.Pending

  return (
    <div className="space-y-2">
      {/* Wrapper for inline session card with overlays */}
      <div className="relative">
        {/* Display inline session card */}
        <InlineSessionCard
          session={session}
          hideAgentIds={currentAgentIds}
          linkPath={chatLinkPath}
          onClick={onSessionClick}
        />

        {/* Running indicator and cancel button - top right corner */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {isRunning && (
            <span className="text-blue-500 h-4 w-4 loading loading-ring pointer-events-none" />
          )}
          {isRunning && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
                e.stopPropagation()
                e.preventDefault()
                onCancel()
              }}
              className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive pointer-events-auto"
            >
              <XIcon className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Display media outputs below session card if they exist */}
      {hasMediaOutputs && (
        <ToolMediaRenderer results={mediaResults} args={toolArgs} />
      )}

      {/* Display error if present */}
      {displayError && (
        <div className="mt-2">
          <AlertDestructive title="Tool Call failed">
            <AlertDescription>
              <TextClampMore text={displayError} lines={3} />
            </AlertDescription>
          </AlertDestructive>
        </div>
      )}

      {/* Small tool badge - always visible at bottom right using ToolHoverMenu */}
      {/* Only show for session post tools - other tools show this in ToolResultActionBar */}
      {toolName && toolArgs && sessionId && (
        <div className="flex justify-end mt-2">
          <ToolHoverMenu toolName={toolName} args={toolArgs} result={results} />
        </div>
      )}
    </div>
  )
}
