import type { StoreApi, UseBoundStore } from 'zustand'

export interface OnboardingRoutes {
  /** Base path for the onboarding flow (e.g., '/gigabrain/onboarding' or '/new/agent') */
  base: string
  /** Route to go back from chat step (e.g., '/gigabrain' or '/new/agent') */
  previousFromChat: string
}

export interface OnboardingConfig {
  /** The agent key/name to use for the onboarding chat */
  agent_name: string
  /** Minimum number of user messages before allowing to continue */
  min_n_turns: number
  /** The initial message sent to start the conversation */
  initial_user_message: string
  /** Route configuration */
  routes: OnboardingRoutes
  /** Storage key for zustand persist (to keep separate state per flow) */
  storageKey: string
  /** Loading message shown while signing in */
  loadingSignInMessage?: string
  /** Loading message shown while loading the builder */
  loadingBuilderMessage?: string
  /** Title for the identity step */
  identityTitle?: string
  /** Title for the finish step */
  finishTitle?: string
}

export interface ReferenceImage {
  imageUrl: string
  description: string
}

export interface OnboardingState {
  sessionId: string | null
  profileImageUrl: string | null
  name: string
  username: string
  referenceImages: ReferenceImage[]
  agentInstructions: string | null
  agentDescription: string | null
  lastUpdated: number | null
  setSessionId: (sessionId: string) => void
  setProfileImageUrl: (url: string) => void
  setName: (name: string) => void
  setUsername: (username: string) => void
  setReferenceImages: (images: ReferenceImage[]) => void
  setAgentInstructions: (instructions: string) => void
  setAgentDescription: (description: string) => void
  reset: () => void
}

/** Type for the zustand store hook returned by createOnboardingStore */
export type OnboardingStore = UseBoundStore<StoreApi<OnboardingState>>
