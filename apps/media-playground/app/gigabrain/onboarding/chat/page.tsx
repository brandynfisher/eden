'use client'

import { gigabrainOnboardingConfig } from '../onboarding_config'
import { ChatInitPage } from '@/features/onboarding-flow'

export default function OnboardingChatPage() {
  return <ChatInitPage config={gigabrainOnboardingConfig} />
}
