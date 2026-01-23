import { OnboardingState, ReferenceImage } from './types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000

const createInitialState = () => ({
  sessionId: null as string | null,
  profileImageUrl: null as string | null,
  name: '',
  username: '',
  referenceImages: [] as ReferenceImage[],
  agentInstructions: null as string | null,
  agentDescription: null as string | null,
  lastUpdated: null as number | null,
})

/**
 * Factory function to create an onboarding store with a custom storage key.
 * This allows different onboarding flows to maintain separate persisted state.
 */
export function createOnboardingStore(storageKey: string) {
  return create<OnboardingState>()(
    persist(
      set => {
        const initialState = createInitialState()
        return {
          ...initialState,
          setSessionId: sessionId =>
            set({ sessionId, lastUpdated: Date.now() }),
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
          reset: () => set({ ...createInitialState(), lastUpdated: null }),
        }
      },
      {
        name: storageKey,
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
}
