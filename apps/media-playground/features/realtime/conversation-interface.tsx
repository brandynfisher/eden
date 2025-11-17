'use client'

import { DevPanel } from './components/dev-panel'
import { StatusIndicator } from './components/status-indicator'
import { Button } from '@/components/ui/button'
import { AgentContext, buildAgentPrompt } from '@/lib/voice/build-agent-prompt'
import { useVoiceConversation } from '@/lib/voice/use-voice-conversation'
import { Maximize2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FC } from 'react'

interface ConversationInterfaceProps {
  agentName: string
  agentContext: AgentContext
  isDevMode?: boolean
}

const ConversationInterface: FC<ConversationInterfaceProps> = ({
  agentName,
  agentContext,
  isDevMode = true,
}) => {
  const router = useRouter()

  // Build the agent prompt from context
  const agentPrompt = buildAgentPrompt(agentContext, { name: agentName })

  // Initialize voice conversation with ElevenLabs provider
  // All settings come from DEFAULT_AGENT_CONFIG in lib/voice/agent-config.ts
  // Override here only if this specific conversation needs different settings
  const conversation = useVoiceConversation({
    provider: 'elevenlabs',
    agentPrompt,
    // conversationConfig: {
    //   agent: {
    //     prompt: {
    //       llm: 'claude-haiku-4-5', // Uncomment to override the default LLM
    //     },
    //   },
    // },
  })

  // Toggle fullscreen by removing dev=true from URL
  const handleToggleFullscreen = () => {
    const currentPath = window.location.pathname
    router.push(currentPath)
  }

  // Minimal UI for production mode
  if (!isDevMode) {
    return (
      <div className="flex flex-col items-center gap-6">
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              conversation.status === 'connected'
                ? 'bg-green-500'
                : conversation.status === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-gray-500'
            }`}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {conversation.status}
          </span>
        </div>

        {/* Single Action Button */}
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
    )
  }

  // Full dev mode UI
  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Main Control Panel */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <StatusIndicator
              status={conversation.status}
              isSpeaking={conversation.isSpeaking}
            />

            {/* Fullscreen Button */}
            <Button
              onClick={handleToggleFullscreen}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Maximize2 className="w-4 h-4" />
              Fullscreen
            </Button>
          </div>

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
