'use client'

import { newAgentOnboardingConfig } from '../onboarding_config'
import { useNewAgentOnboardingStore } from '../store'
import { FinishPage } from '@/features/onboarding-flow'

const AGENT_PROGRESS_STEPS = [
  { message: 'Analyzing conversation...', duration: 5000, progressEnd: 20 },
  { message: 'Constructing persona...', duration: 5000, progressEnd: 40 },
  { message: 'Setting up visual identity...', duration: 5000, progressEnd: 60 },
  { message: 'Building Memory system...', progressEnd: 80 },
  { message: 'Finalizing your agent...', progressEnd: 100 },
  { message: 'Your agent is ready!', progressEnd: 100 },
]

export default function NewAgentFinishPage() {
  return (
    <FinishPage
      config={newAgentOnboardingConfig}
      useStore={useNewAgentOnboardingStore}
      progressSteps={AGENT_PROGRESS_STEPS}
    />
  )
}
