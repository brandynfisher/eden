import { OnboardingConfig } from '@/features/onboarding-flow'

export const spiritOnboardingConfig: OnboardingConfig = {
  agent_name: 'spirit',
  min_n_turns: 3,
  initial_user_message:
    'Hey! I want to create a Spirit. Can you help me get started?',
  routes: {
    base: '/new/agent',
    previousFromChat: '/new/spirit',
  },
  // Use the same storageKey as /new/agent so state is shared with identity/finish pages
  storageKey: 'new-agent-onboarding-storage',
  loadingSignInMessage: 'Signing you in...',
  loadingBuilderMessage: 'Loading Spirit Builder...',
  identityTitle: 'Your Spirits Identity',
  finishTitle: 'agent',
}
