'use client'

import { OnboardingConfig } from '../types'
import LoadingIndicator from '@/components/loading-indicator'
import { useAgentQuery } from '@/hooks/query/use-agent-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

interface ChatInitPageProps {
  config: OnboardingConfig
}

export function ChatInitPage({ config }: ChatInitPageProps) {
  const router = useRouter()
  const { user, isSignedIn, isLoading, verifyAuth } = useAuthState()
  const hasCreatedSession = useRef(false)
  const hasTriggeredAuth = useRef(false)

  const { agent } = useAgentQuery({ key: config.agent_name })

  // Trigger Clerk OAuth login if user is not signed in
  useEffect(() => {
    if (!isSignedIn && !isLoading && !hasTriggeredAuth.current) {
      hasTriggeredAuth.current = true
      verifyAuth()
    }
  }, [isSignedIn, isLoading, verifyAuth])

  // Automatically create session with hardcoded message
  useEffect(() => {
    if (agent && user && !hasCreatedSession.current) {
      hasCreatedSession.current = true

      const createSession = async () => {
        try {
          const response = await fetch('/api/sessions/prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: config.initial_user_message,
              attachments: [],
              agent_ids: [agent._id],
            }),
          })

          if (response.ok) {
            const result = await response.json()
            if (result.session_id) {
              router.push(`${config.routes.base}/chat/${result.session_id}`)
            }
          }
        } catch (error) {
          console.error('Failed to create onboarding session:', error)
        }
      }

      createSession()
    }
  }, [agent, user, router, config])

  const signInMessage = config.loadingSignInMessage || 'Signing you in...'
  const builderMessage = config.loadingBuilderMessage || 'Loading builder...'

  // Show loading state while authenticating or loading user data
  if (!user || isLoading) {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingIndicator className="w-10 h-10 text-yellow-400" />
          <p className="text-gray-300">
            {!isSignedIn ? signInMessage : builderMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LoadingIndicator className="w-10 h-10 text-yellow-400" />
        <p className="text-gray-300">{builderMessage}</p>
      </div>
    </div>
  )
}
