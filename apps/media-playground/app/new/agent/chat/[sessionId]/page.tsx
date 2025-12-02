'use client'

import { newAgentOnboardingConfig } from '../../onboarding_config'
import { useNewAgentOnboardingStore } from '../../store'
import { ChatSessionPage } from '@/features/onboarding-flow'

export default function NewAgentChatSessionPage() {
  return (
    <ChatSessionPage
      config={newAgentOnboardingConfig}
      useStore={useNewAgentOnboardingStore}
    />
  )
}
