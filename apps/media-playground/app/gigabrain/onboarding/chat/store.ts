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
  agentInstructions: string | null
  agentDescription: string | null
  memoryInstructions: string | null
  setSessionId: (sessionId: string) => void
  setProfileImageUrl: (url: string) => void
  setName: (name: string) => void
  setUsername: (username: string) => void
  setReferenceImages: (images: ReferenceImage[]) => void
  setAgentInstructions: (instructions: string) => void
  setAgentDescription: (description: string) => void
  setMemoryInstructions: (instructions: string) => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      sessionId: null,
      profileImageUrl: null,
      name: '',
      username: '',
      referenceImages: [],
      agentInstructions: null,
      agentDescription: null,
      memoryInstructions: null,
      setSessionId: sessionId => set({ sessionId }),
      setProfileImageUrl: url => set({ profileImageUrl: url }),
      setName: name => set({ name }),
      setUsername: username => set({ username }),
      setReferenceImages: images => set({ referenceImages: images }),
      setAgentInstructions: instructions =>
        set({ agentInstructions: instructions }),
      setAgentDescription: description =>
        set({ agentDescription: description }),
      setMemoryInstructions: instructions =>
        set({ memoryInstructions: instructions }),
    }),
    {
      name: 'gigabrain-onboarding-storage',
    },
  ),
)
