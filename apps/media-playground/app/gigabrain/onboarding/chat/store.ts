import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ReferenceImage {
  imageUrl: string
  description: string
}

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000

const initialState = {
  sessionId: null as string | null,
  profileImageUrl: null as string | null,
  name: '',
  username: '',
  referenceImages: [] as ReferenceImage[],
  agentInstructions: null as string | null,
  agentDescription: null as string | null,
  memoryInstructions: null as string | null,
  lastUpdated: null as number | null,
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
  lastUpdated: number | null
  setSessionId: (sessionId: string) => void
  setProfileImageUrl: (url: string) => void
  setName: (name: string) => void
  setUsername: (username: string) => void
  setReferenceImages: (images: ReferenceImage[]) => void
  setAgentInstructions: (instructions: string) => void
  setAgentDescription: (description: string) => void
  setMemoryInstructions: (instructions: string) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      ...initialState,
      setSessionId: sessionId => set({ sessionId, lastUpdated: Date.now() }),
      setProfileImageUrl: url =>
        set({ profileImageUrl: url, lastUpdated: Date.now() }),
      setName: name => set({ name, lastUpdated: Date.now() }),
      setUsername: username => set({ username, lastUpdated: Date.now() }),
      setReferenceImages: images =>
        set({ referenceImages: images, lastUpdated: Date.now() }),
      setAgentInstructions: instructions =>
        set({ agentInstructions: instructions, lastUpdated: Date.now() }),
      setAgentDescription: description =>
        set({ agentDescription: description, lastUpdated: Date.now() }),
      setMemoryInstructions: instructions =>
        set({ memoryInstructions: instructions, lastUpdated: Date.now() }),
      reset: () => set({ ...initialState, lastUpdated: null }),
    }),
    {
      name: 'gigabrain-onboarding-storage',
      onRehydrateStorage: () => state => {
        if (state?.lastUpdated) {
          const isStale = Date.now() - state.lastUpdated > FIVE_DAYS_MS
          if (isStale) {
            state.reset()
          }
        }
      },
    },
  ),
)
