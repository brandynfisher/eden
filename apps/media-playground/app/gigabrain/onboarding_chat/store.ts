import { create } from 'zustand'

interface OnboardingState {
  // No stored state needed for now
  // We can add state here later if needed for multi-step onboarding
}

export const useOnboardingStore = create<OnboardingState>()(() => ({
  // Empty for now
}))
