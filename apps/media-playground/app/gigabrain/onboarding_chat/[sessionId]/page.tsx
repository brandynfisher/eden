'use client'

import { OnboardingChatLayout } from '../components/onboarding-chat-layout'
import { onboardingChatConfig } from '../config'
import LoadingIndicator from '@/components/loading-indicator'
import { LiveAudioProvider } from '@/features/sessions/live-audio/live-audio-context'
import Session from '@/features/sessions/session'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { useParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

function OnboardingChatSessionContent() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.sessionId as string

  // Use the session query to track messages
  const { data: session, isLoading } = useSessionQuery({
    sessionId: sessionId || '',
    enabled: !!sessionId && sessionId !== 'new',
  })

  // Count user messages in the session
  const userMessageCount =
    session?.messages?.filter(msg => msg.role === 'user').length || 0

  const canProceed = userMessageCount >= onboardingChatConfig.min_n_turns

  const handleGeneratePersona = useCallback(() => {
    router.push('/gigabrain/onboarding_knowledge')
  }, [router])

  if (isLoading && sessionId !== 'new') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingIndicator className="w-10 h-10 text-yellow-400" />
      </div>
    )
  }

  return (
    <OnboardingChatLayout
      userMessageCount={userMessageCount}
      headerAction={
        <button
          onClick={handleGeneratePersona}
          disabled={!canProceed}
          className={`
            w-full md:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold text-white
            transition-all duration-300 whitespace-nowrap shadow-lg
            ${
              canProceed
                ? 'hover:scale-[1.02] hover:shadow-xl'
                : 'cursor-not-allowed opacity-50'
            }
          `}
          style={{
            background: 'linear-gradient(135deg, #e6a825, #7c8aff)',
          }}
        >
          Generate Persona →
        </button>
      }
    >
      <Session optimisticSessionId={sessionId} />
    </OnboardingChatLayout>
  )
}

export default function OnboardingChatSessionPage() {
  return (
    <LiveAudioProvider>
      <OnboardingChatSessionContent />
    </LiveAudioProvider>
  )
}
