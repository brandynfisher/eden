'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import SessionWelcome from '@/features/sessions/components/session-welcome'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import Session from '@/features/sessions/session'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { Agent } from '@edenlabs/eden-sdk'
import { useParams, useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'

const SessionChat: FC = () => {
  const params = useParams()
  const agentId = params?.agentId as string | undefined
  const router = useRouter()
  const { user } = useAuthState()
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [creatingSession, setCreatingSession] = useState<{
    content: string
    attachments?: string[]
    thinking?: boolean
    sessionId?: string
  } | null>(null)

  // Track the current path to detect actual navigation
  const currentPathRef = useRef<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      const previousPath = currentPathRef.current

      console.log('[SessionChat Effect] Path check:', {
        currentPath,
        previousPath,
        hasCreatingSession: !!creatingSession,
        isOnWelcome: currentPath === `/chat/${agentId}`,
      })

      // If we navigate to the welcome path, clear creating session
      if (
        currentPath === `/chat/${agentId}` &&
        previousPath !== currentPath &&
        creatingSession
      ) {
        console.log(
          '[SessionChat Effect] Navigated to welcome, clearing session',
        )
        setCreatingSession(null)
      }

      currentPathRef.current = currentPath
    }
  })

  console.log('[SessionChat] Render:', {
    agentId,
    hasCreatingSession: !!creatingSession,
    creatingSessionId: creatingSession?.sessionId,
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'SSR',
  })

  const {
    agent,
    isError: agentError,
    error: agentErrorDetails,
  } = useAgentQuery({ key: agentId as string })

  const handleSendMessage = useCallback(
    async (content: string, attachments?: string[], thinking?: boolean) => {
      if (!user || !agent) return

      // Immediately transition to session view
      setCreatingSession({ content, attachments, thinking })

      try {
        // Send message to create session
        const payload = {
          content,
          attachments,
          agent_ids: [agent._id],
          thinking,
        }
        const response = await fetch('/api/sessions/prompt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Failed to send message')
        }

        // Parse SSE stream to get session_id from first event
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body')
        }

        let foundSession = false
        while (!foundSession) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.event === 'session_created' && data.data?.session_id) {
                  // Got session_id! Store it in state and update URL without navigation
                  const sessionId = data.data.session_id
                  setCreatingSession(prev =>
                    prev ? { ...prev, sessionId } : null,
                  )
                  // Update URL bar silently without triggering Next.js navigation
                  window.history.replaceState(
                    null,
                    '',
                    `/chat/${agentId}/${sessionId}`,
                  )
                  reader.cancel()
                  foundSession = true
                  break
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (error) {
        console.error('Error creating session:', error)
        setCreatingSession(null)
      }
    },
    [user, agent, agentId, router],
  )

  const handleAgentSelect = (selectedAgent: {
    _id: string
    username: string
    name: string
    userImage?: string
  }) => {
    router.push(`/chat/${selectedAgent.username}`)
  }

  // Show loading if we're waiting for agent data
  if (!agent && !agentError) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex justify-center items-center">
          <LoadingIndicator className="w-10 h-10 text-purple-600" />
        </div>
      </main>
    )
  }

  // Show agent error
  if (agentError) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4">
          <AlertDestructive title="Error loading agent">
            <AlertDescription>{agentErrorDetails?.message}</AlertDescription>
          </AlertDestructive>
        </div>
      </main>
    )
  }

  // If we're creating a session, show Session component with pending state
  // Once we get the session_id, we'll update the URL but keep rendering Session
  if (creatingSession && agent) {
    console.log('[SessionChat] Rendering Session component with pendingMessage')
    return (
      <Session
        optimisticSessionId={creatingSession.sessionId}
        pendingMessage={{
          content: creatingSession.content,
          attachments: creatingSession.attachments,
          agent: agent,
        }}
      />
    )
  }

  console.log('[SessionChat] Rendering welcome screen')

  // Otherwise show the welcome screen
  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 max-w-[--aui-thread-max-width] mx-auto w-full">
        <SessionWelcome
          variant="chat"
          agent={agent as Agent}
          onSendMessage={handleSendMessage}
          isLoading={false}
          onAgentSelectorOpen={() => setIsAgentSelectorOpen(true)}
        />
      </div>
      <SingleAgentSelectorModal
        open={isAgentSelectorOpen}
        onOpenChange={setIsAgentSelectorOpen}
        onSelect={handleAgentSelect}
      />
    </main>
  )
}

export default SessionChat
