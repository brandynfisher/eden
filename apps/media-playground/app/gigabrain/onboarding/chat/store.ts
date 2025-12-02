import { gigabrainOnboardingConfig } from '../onboarding_config'
import { createOnboardingStore } from '@/features/onboarding-flow'

export const useOnboardingStore = createOnboardingStore(
  gigabrainOnboardingConfig.storageKey,
)

// Re-export types for backwards compatibility
export type { ReferenceImage } from '@/features/onboarding-flow'
