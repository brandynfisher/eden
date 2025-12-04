import { OnboardingConfig } from '@/features/onboarding-flow'

export const newAgentOnboardingConfig: OnboardingConfig = {
  agent_name: 'agent-builder',
  min_n_turns: 3,
  initial_user_message:
    'Hey! I want to create a new agent. Can you help me get started?',
  routes: {
    base: '/new/agent',
    previousFromChat: '/new/agent',
  },
  storageKey: 'new-agent-onboarding-storage',
  loadingSignInMessage: 'Signing you in...',
  loadingBuilderMessage: 'Loading Agent Builder...',
  identityTitle: 'Your agents Identity',
  finishTitle: 'agent',
}
