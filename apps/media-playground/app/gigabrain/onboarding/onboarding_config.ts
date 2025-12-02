import { OnboardingConfig } from '@/features/onboarding-flow'

export const gigabrainOnboardingConfig: OnboardingConfig = {
  agent_name: 'gigabrain_builder',
  min_n_turns: 3,
  initial_user_message:
    'Hey! Can you help me set up a new gigabrain agent plz?',
  routes: {
    base: '/gigabrain/onboarding',
    previousFromChat: '/gigabrain',
  },
  storageKey: 'gigabrain-onboarding-storage',
  loadingSignInMessage: 'Signing you in...',
  loadingBuilderMessage: 'Loading Gigabrain builder...',
  identityTitle: 'Your agents Identity',
  finishTitle: 'Gigabrain',
}
