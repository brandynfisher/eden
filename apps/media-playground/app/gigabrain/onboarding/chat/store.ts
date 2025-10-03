import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OnboardingState {
  sessionId: string | null
  profileImageUrl: string | null
  setSessionId: (sessionId: string) => void
  setProfileImageUrl: (url: string) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      sessionId: null,
      profileImageUrl: null,
      setSessionId: sessionId => set({ sessionId }),
      setProfileImageUrl: url => set({ profileImageUrl: url }),
    }),
    {
      name: 'gigabrain-onboarding-storage',
    },
  ),
)
