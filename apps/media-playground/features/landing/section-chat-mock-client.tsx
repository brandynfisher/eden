'use client'

import { ChatMockWidget } from '@/features/sessions/components/chat-mock-widget'
import { AgentBasicInfo } from '@/lib/actions/agent'
import { TypographyH1 } from '@edenlabs/eden-react'
import React from 'react'

export interface SectionChatMockProps {
  agents: AgentBasicInfo[]
}

export function SectionChatMockClient({ agents }: SectionChatMockProps) {
  return (
    <div className="max-w-5xl mx-auto px-2 md:px-4">
      <TypographyH1 className="text-3xl font-bold mb-4 text-center">
        A Garden of Artificial Delights
      </TypographyH1>
      <p className="text-center text-muted-foreground mb-6">
        Eden is building a world of autonomous generative agents that create
        with people and with each other.
      </p>
      <ChatMockWidget agents={agents} />
    </div>
  )
}
