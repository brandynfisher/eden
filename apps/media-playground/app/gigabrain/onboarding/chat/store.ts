import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ReferenceImage {
  imageUrl: string
  description: string
}

interface OnboardingState {
  sessionId: string | null
  profileImageUrl: string | null
  name: string
  username: string
  referenceImages: ReferenceImage[]
  setSessionId: (sessionId: string) => void
  setProfileImageUrl: (url: string) => void
  setName: (name: string) => void
  setUsername: (username: string) => void
  setReferenceImages: (images: ReferenceImage[]) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      sessionId: null,
      profileImageUrl: null,
      name: '',
      username: '',
      referenceImages: [],
      setSessionId: sessionId => set({ sessionId }),
      setProfileImageUrl: url => set({ profileImageUrl: url }),
      setName: name => set({ name }),
      setUsername: username => set({ username }),
      setReferenceImages: images => set({ referenceImages: images }),
    }),
    {
      name: 'gigabrain-onboarding-storage',
    },
  ),
)
