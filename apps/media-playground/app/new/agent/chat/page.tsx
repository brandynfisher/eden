'use client'

import { newAgentOnboardingConfig } from '../onboarding_config'
import { ChatInitPage } from '@/features/onboarding-flow'

export default function NewAgentChatPage() {
  return <ChatInitPage config={newAgentOnboardingConfig} />
}
