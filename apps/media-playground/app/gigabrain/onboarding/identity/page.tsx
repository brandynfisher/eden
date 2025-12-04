'use client'

import { useOnboardingStore } from '../chat/store'
import { gigabrainOnboardingConfig } from '../onboarding_config'
import { IdentityPage } from '@/features/onboarding-flow'

export default function OnboardingIdentityPage() {
  return (
    <IdentityPage
      config={gigabrainOnboardingConfig}
      useStore={useOnboardingStore}
    />
  )
}
