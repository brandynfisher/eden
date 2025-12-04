'use client'

import { OnboardingConfig, OnboardingStore } from '../types'
import { OnboardingLayout } from './onboarding-layout'
import LoadingIndicator from '@/components/loading-indicator'
import { LiveAudioProvider } from '@/features/sessions/live-audio/live-audio-context'
import Session from '@/features/sessions/session'
import { useSessionQuery } from '@/hooks/query/use-session-query'
import { getCloudfrontUrl } from '@/lib/media'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useMemo } from 'react'

interface ChatSessionPageProps {
  config: OnboardingConfig
  useStore: OnboardingStore
}

function ChatSessionContent({ config, useStore }: ChatSessionPageProps) {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.sessionId as string
  const setSessionId = useStore(state => state.setSessionId)

  // Use the session query to track messages
  const { data: session, isLoading } = useSessionQuery({
    sessionId: sessionId || '',
    enabled: !!sessionId && sessionId !== 'new',
  })

  // Count user messages in the session
  const userMessageCount =
    session?.messages?.filter(msg => msg.role === 'user').length || 0

  const canProceed = userMessageCount >= config.min_n_turns

  const progressText = canProceed
    ? 'Talk as long as you want or click continue.'
    : `${userMessageCount}/${config.min_n_turns} messages`

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
    router.push(`${config.routes.base}/identity`)
  }, [router, sessionId, setSessionId, config.routes.base])

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
      previousRoute={config.routes.previousFromChat}
      nextRoute={`${config.routes.base}/identity`}
      onContinue={handleGeneratePersona}
      progressText={progressText}
      agentImage={agentImage}
    >
      <Session optimisticSessionId={sessionId} hideNavbar />
    </OnboardingLayout>
  )
}

export function ChatSessionPage(props: ChatSessionPageProps) {
  return (
    <LiveAudioProvider>
      <ChatSessionContent {...props} />
    </LiveAudioProvider>
  )
}
