'use client'

// Reuse the same store as /new/agent since we share the storageKey and route to /new/agent/identity
import { useNewAgentOnboardingStore } from '../../../agent/store'
import { spiritOnboardingConfig } from '../../onboarding_config'
import { ChatSessionPage } from '@/features/onboarding-flow'

export default function SpiritChatSessionPage() {
  return (
    <ChatSessionPage
      config={spiritOnboardingConfig}
      useStore={useNewAgentOnboardingStore}
    />
  )
}
