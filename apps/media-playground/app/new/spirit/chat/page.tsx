'use client'

import { spiritOnboardingConfig } from '../onboarding_config'
import { ChatInitPage } from '@/features/onboarding-flow'

export default function SpiritChatPage() {
  return <ChatInitPage config={spiritOnboardingConfig} />
}
