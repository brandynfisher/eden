'use client'

import { OnboardingLayout } from '../../components/onboarding-layout'
import { onboardingChatConfig } from '../config'
import { useOnboardingStore } from '../store'
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
  const setSessionId = useOnboardingStore(state => state.setSessionId)

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
    if (sessionId) {
      setSessionId(sessionId)
    }
    router.push('/gigabrain/onboarding/step2')
  }, [router, sessionId, setSessionId])

  if (isLoading && sessionId !== 'new') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingIndicator className="w-10 h-10 text-yellow-400" />
      </div>
    )
  }

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={4}
      canContinue={canProceed}
      previousRoute="/gigabrain"
      nextRoute="/gigabrain/onboarding/step2"
      onContinue={handleGeneratePersona}
    >
      <Session optimisticSessionId={sessionId} />
    </OnboardingLayout>
  )
}

export default function OnboardingChatSessionPage() {
  return (
    <LiveAudioProvider>
      <OnboardingChatSessionContent />
    </LiveAudioProvider>
  )
}
