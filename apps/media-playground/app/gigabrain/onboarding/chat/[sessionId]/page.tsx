'use client'

import { OnboardingLayout } from '../../components/onboarding-layout'
import { onboardingChatConfig } from '../../onboarding_config'
import { useOnboardingStore } from '../store'
import LoadingIndicator from '@/components/loading-indicator'
import { LiveAudioProvider } from '@/features/sessions/live-audio/live-audio-context'
import Session from '@/features/sessions/session'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { getCloudfrontUrl } from '@/lib/media'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

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

  const progressText = canProceed
    ? 'Talk as long as you want or click continue.'
    : `${userMessageCount}/${onboardingChatConfig.min_n_turns} messages`

  // Get agent image for the header
  const agentImage = useMemo(() => {
    const agent = session?.agents?.[0]
    if (!agent?.userImage) return undefined
    return agent.userImage.startsWith('https://')
      ? agent.userImage
      : getCloudfrontUrl(agent.userImage)
  }, [session?.agents])

  const handleGeneratePersona = useCallback(() => {
    if (sessionId) {
      setSessionId(sessionId)
    }
    router.push('/gigabrain/onboarding/identity')
  }, [router, sessionId, setSessionId])

  if (isLoading && sessionId !== 'new') {
    return (
      <div className="h-full bg-black flex items-center justify-center">
        <LoadingIndicator className="w-10 h-10 text-yellow-400" />
      </div>
    )
  }

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={3}
      canContinue={canProceed}
      previousRoute="/gigabrain"
      nextRoute="/gigabrain/onboarding/identity"
      onContinue={handleGeneratePersona}
      progressText={progressText}
      agentImage={agentImage}
    >
      <Session optimisticSessionId={sessionId} hideNavbar />
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
