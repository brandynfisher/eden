'use client'

import { DevPanel } from './components/dev-panel'
import { StatusIndicator } from './components/status-indicator'
import { Button } from '@/components/ui/button'
import { AgentContext, buildAgentPrompt } from '@/lib/voice/build-agent-prompt'
import { useVoiceConversation } from '@/lib/voice/use-voice-conversation'
import { FC } from 'react'

interface ConversationInterfaceProps {
  agentName: string
  agentContext: AgentContext
}

const ConversationInterface: FC<ConversationInterfaceProps> = ({
  agentName,
  agentContext,
}) => {
  // Build the agent prompt from context
  const agentPrompt = buildAgentPrompt(agentContext, { name: agentName })

  // Initialize voice conversation with ElevenLabs provider
  const conversation = useVoiceConversation({
    provider: 'elevenlabs',
    agentPrompt,
    temperature: 0.75,
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Main Control Panel */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex flex-col gap-4">
          <StatusIndicator
            status={conversation.status}
            isSpeaking={conversation.isSpeaking}
          />

          {/* Action Buttons */}
          <div className="flex gap-3">
            {conversation.status !== 'connected' ? (
              <Button
                onClick={conversation.startConversation}
                className="bg-primary hover:bg-primary/90"
                size="lg"
                disabled={conversation.status === 'connecting'}
              >
                {conversation.status === 'connecting'
                  ? 'Connecting...'
                  : 'Start Conversation'}
              </Button>
            ) : (
              <Button
                onClick={conversation.endConversation}
                variant="destructive"
                size="lg"
              >
                Stop Conversation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dev Panel */}
      <DevPanel
        conversation={conversation}
        agentContext={agentContext}
        agentPrompt={agentPrompt}
      />
    </div>
  )
}

export default ConversationInterface
