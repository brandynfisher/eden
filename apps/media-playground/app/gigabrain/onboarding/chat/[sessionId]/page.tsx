'use client'

import { gigabrainOnboardingConfig } from '../../onboarding_config'
import { useOnboardingStore } from '../store'
import { ChatSessionPage } from '@/features/onboarding-flow'

export default function OnboardingChatSessionPage() {
  return (
    <ChatSessionPage
      config={gigabrainOnboardingConfig}
      useStore={useOnboardingStore}
    />
  )
}
