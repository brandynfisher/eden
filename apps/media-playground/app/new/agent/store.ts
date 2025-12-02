import { newAgentOnboardingConfig } from './onboarding_config'
import { createOnboardingStore } from '@/features/onboarding-flow'

export const useNewAgentOnboardingStore = createOnboardingStore(
  newAgentOnboardingConfig.storageKey,
)
