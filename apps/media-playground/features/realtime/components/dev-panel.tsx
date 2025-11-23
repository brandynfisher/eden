'use client'

import { AgentContextDisplay } from './agent-context-display'
import { ConnectionStatus } from './connection-status'
import { ConversationTranscript } from './conversation-transcript'
import { DebugLogs } from './debug-logs'
import { Button } from '@/components/ui/button'
import {
  AgentContext,
  DynamicVariables,
} from '@/lib/voice/build-dynamic-variables'
import { VoiceConversationState } from '@/lib/voice/types'
import { FC, useState } from 'react'

interface DevPanelProps {
  conversation: VoiceConversationState
  agentContext: AgentContext
  dynamicVariables: DynamicVariables
}

export const DevPanel: FC<DevPanelProps> = ({
  conversation,
  agentContext,
  dynamicVariables,
}) => {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <div
      className={`border border-border rounded-lg bg-card transition-all duration-300 ${
        isMinimized ? 'h-14' : 'min-h-[400px]'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Dev Panel</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          {isMinimized ? '▼ Expand' : '▲ Minimize'}
        </Button>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4">
          <ConversationTranscript transcript={conversation.transcript} />
          <DebugLogs logs={conversation.debugLogs} />
          <ConnectionStatus
            status={conversation.status}
            isSpeaking={conversation.isSpeaking}
            canSendFeedback={conversation.canSendFeedback}
          />
          <AgentContextDisplay
            agentContext={agentContext}
            dynamicVariables={dynamicVariables}
          />
        </div>
      )}
    </div>
  )
}
