'use client'

import { AssistantMessage } from '@/features/sessions/components/assistant-message'
import { Message } from '@edenlabs/eden-sdk'

interface NonStreamingMessageDisplayProps {
  sessionId: string
  isChatRoute?: boolean
  waitingForResponse: boolean
  respondingAgents: Array<{
    _id: string
    username: string
    name: string
    userImage?: string | undefined
    showAvatar?: boolean
  }>
}

export const NonStreamingMessageDisplay = ({
  sessionId,
  isChatRoute = false,
  waitingForResponse,
  respondingAgents,
}: NonStreamingMessageDisplayProps) => {
  if (!waitingForResponse) {
    return null
  }

  // Don't show anything if no agents should respond
  if (respondingAgents.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      {respondingAgents.map((agent, index) => (
        <AssistantMessage
          key={`loading-${agent._id}-${index}`}
          sessionId={sessionId}
          message={
            {
              _id: `loading-${agent._id}-${index}`,
              session: [] as Message['session'],
              content: '',
              sender: agent,
              createdAt: new Date(),
              updatedAt: new Date(),
              role: 'assistant',
            } as Message
          }
          showAvatar={agent.showAvatar ?? true}
          isStreamingTokens={true} // This will show the loading indicator
          isChatRoute={isChatRoute}
        />
      ))}
    </div>
  )
}
