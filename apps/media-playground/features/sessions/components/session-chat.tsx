'use client'

import AlertDestructive from '@/components/alert/alert-destructive'
import LoadingIndicator from '@/components/loading-indicator'
import { AlertDescription } from '@/components/ui/alert'
import SessionWelcome from '@/features/sessions/components/session-welcome'
import SingleAgentSelectorModal from '@/features/sessions/components/single-agent-selector-modal'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { Agent } from '@edenlabs/eden-sdk'
import { useParams, useRouter } from 'next/navigation'
import { FC, useCallback, useState } from 'react'

const SessionChat: FC = () => {
  const agentId = useParams()?.agentId as string | undefined
  const router = useRouter()
  const { user } = useAuthState()
  const [isAgentSelectorOpen, setIsAgentSelectorOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const {
    agent,
    isError: agentError,
    error: agentErrorDetails,
  } = useAgentQuery({ key: agentId as string })

  const handleSendMessage = useCallback(
    async (content: string, attachments?: string[], thinking?: boolean) => {
      if (!user || !agent) return

      console.log('[SessionChat] Handling message with thinking:', thinking)

      // Show loading state immediately
      setIsCreating(true)

      try {
        // Send message directly to create session
        const payload = {
          content,
          attachments,
          agent_ids: [agent._id],
          thinking, // Pass thinking state to API
        }
        console.log('[SessionChat] Sending to /api/sessions/prompt:', payload)

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

        const result = await response.json()
        if (result.session_id) {
          // Go directly to the real session
          router.push(`/chat/${agentId}/${result.session_id}`)
        }
      } catch (error) {
        console.error('Error creating session:', error)
        setIsCreating(false)
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

  // If creating session, show loading spinner
  if (isCreating) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 flex justify-center items-center">
          <LoadingIndicator className="w-10 h-10 text-purple-600" />
        </div>
      </main>
    )
  }

  // Otherwise show the welcome screen
  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 max-w-[--aui-thread-max-width] mx-auto w-full">
        <SessionWelcome
          variant="chat"
          agent={agent as Agent}
          onSendMessage={handleSendMessage}
          isLoading={isCreating}
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
