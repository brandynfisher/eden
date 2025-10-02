'use client'

import { OnboardingChatLayout } from './components/onboarding-chat-layout'
import { onboardingChatConfig } from './config'
import LoadingIndicator from '@/components/loading-indicator'
import SessionWelcome from '@/features/sessions/components/session-welcome'
import { LiveAudioProvider } from '@/features/sessions/live-audio/live-audio-context'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function OnboardingChatContent() {
  const router = useRouter()
  const { user } = useAuthState()
  const [isCreatingSession, setIsCreatingSession] = useState(false)

  const {
    agent,
    isError: agentError,
    isLoading: agentLoading,
  } = useAgentQuery({ key: onboardingChatConfig.agent_name })

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Please sign in to continue</div>
      </div>
    )
  }

  if (agentLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingIndicator className="w-10 h-10 text-yellow-400" />
      </div>
    )
  }

  if (agentError || !agent) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">
          Error loading onboarding agent. Please try again later.
        </div>
      </div>
    )
  }

  return (
    <OnboardingChatLayout userMessageCount={0}>
      {/* Welcome Message - shown before any messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-black/60 rounded-xl p-8 border border-yellow-400/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">
              Welcome to Gigabrain! 👋
            </h3>
            <p className="text-gray-300 mb-4">
              Let's start by understanding your community. Tell me about:
            </p>
            <ul className="space-y-2 text-gray-300 list-disc list-inside">
              <li>What your community is about</li>
              <li>Your community's values and culture</li>
              <li>The tone and personality you want</li>
              <li>What makes your community unique</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Message input that will trigger session creation */}
      <SessionWelcome
        variant="chat"
        agent={agent}
        isLoading={isCreatingSession}
        onSendMessage={async (content, attachments) => {
          if (!agent || isCreatingSession) return

          setIsCreatingSession(true)

          try {
            const response = await fetch('/api/sessions/prompt', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content,
                attachments: attachments || [],
                agent_ids: [agent._id],
              }),
            })

            if (response.ok) {
              const result = await response.json()
              if (result.session_id) {
                router.push(`/gigabrain/onboarding_chat/${result.session_id}`)
              }
            } else {
              setIsCreatingSession(false)
            }
          } catch (error) {
            setIsCreatingSession(false)
          }
        }}
      />
    </OnboardingChatLayout>
  )
}

export default function OnboardingChatPage() {
  return (
    <LiveAudioProvider>
      <OnboardingChatContent />
    </LiveAudioProvider>
  )
}
