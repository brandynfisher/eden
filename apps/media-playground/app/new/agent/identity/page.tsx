'use client'

import { newAgentOnboardingConfig } from '../onboarding_config'
import { useNewAgentOnboardingStore } from '../store'
import { IdentityPage } from '@/features/onboarding-flow'

export default function NewAgentIdentityPage() {
  return (
    <IdentityPage
      config={newAgentOnboardingConfig}
      useStore={useNewAgentOnboardingStore}
    />
  )
}
