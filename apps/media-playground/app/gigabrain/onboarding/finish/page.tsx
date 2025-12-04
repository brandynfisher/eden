'use client'

import { useOnboardingStore } from '../chat/store'
import { gigabrainOnboardingConfig } from '../onboarding_config'
import { FinishPage } from '@/features/onboarding-flow'

const GIGABRAIN_PROGRESS_STEPS = [
  { message: 'Analyzing conversation...', duration: 5000, progressEnd: 20 },
  { message: 'Constructing persona...', duration: 5000, progressEnd: 40 },
  { message: 'Setting up visual identity...', duration: 5000, progressEnd: 60 },
  { message: 'Building Memory system...', progressEnd: 80 },
  { message: 'Finalizing your Gigabrain...', progressEnd: 100 },
  { message: 'Your Gigabrain is ready!', progressEnd: 100 },
]

export default function OnboardingFinishPage() {
  return (
    <FinishPage
      config={gigabrainOnboardingConfig}
      useStore={useOnboardingStore}
      progressSteps={GIGABRAIN_PROGRESS_STEPS}
    />
  )
}
