'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import { MessageInput } from '@/features/sessions/components/message-input'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Agent } from '@edenlabs/eden-sdk'
import { FC, useEffect, useState } from 'react'

// Session Welcome Component
const SessionWelcome: FC<{
  agent: Agent | null | undefined
  onSendMessage: () => void
  isLoading: boolean
}> = ({ agent, onSendMessage, isLoading }) => {
  const suggestions = agent?.suggestions || []

  return (
    <div className="aui-thread-welcome">
      <div className="aui-thread-welcome-center relative flex flex-col items-center justify-center min-h-full py-8">
        {agent && (
          <>
            <div className="text-sm text-muted-foreground mb-2">
              {agent.name}
            </div>
            <div className="w-16 h-16 md:w-24 md:h-24 mb-4">
              <img
                src={getCloudfrontOriginalUrl(agent.userImage)}
                alt={agent.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
          </>
        )}

        <div className="mb-8">
          {agent && (
            <p className="text-lg text-center">
              {agent.greeting || 'What do you want to create today?'}
            </p>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="mt-6 w-full">
            <div className="flex flex-row gap-2 flex-wrap justify-center">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  className="text-sm hover:bg-secondary/20 flex-shrink-0 border border-border rounded-full bg-popover/30 px-3 py-2"
                  onClick={() => onSendMessage()}
                  disabled={isLoading}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Main Component - Shows welcome screen until user sends message
type Props = {
  agentId: string
  sessionId?: string
}

const SessionChat: FC<Props> = ({ agentId }) => {
  const [isMounted, setIsMounted] = useState(false)
  const { user } = useAuthState()

  const {
    agent,
    isError: agentError,
    error: agentErrorDetails,
  } = useAgentQuery({ key: agentId })

  // Mount effect
  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsMounted(true)
  }, [])

  const handleSendMessage = async () => {
    if (!user) return
    // Navigate to create a new session
    console.log('handleSendMessage')
  }

  if (!isMounted) {
    return null
  }

  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      {!agent ? (
        <div className="flex-1 flex justify-center items-center">
          <LoadingIndicator className="w-10 h-10 text-purple-600" />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 max-w-[--aui-thread-max-width] mx-auto w-full">
            <SessionWelcome
              agent={agent}
              onSendMessage={handleSendMessage}
              isLoading={false}
            />
          </div>

          {/* Message Input */}
          <div className="max-w-[--aui-thread-max-width] mx-auto w-full sticky bottom-0">
            <MessageInput
              sessionId="new"
              onStreamingMessage={handleSendMessage}
            />
          </div>
        </>
      )}

      {agentError && (
        <div className="p-4">
          <AlertDestructive title="Error loading agent">
            <AlertDescription>{agentErrorDetails?.message}</AlertDescription>
          </AlertDestructive>
        </div>
      )}
    </main>
  )
}

export default SessionChat
