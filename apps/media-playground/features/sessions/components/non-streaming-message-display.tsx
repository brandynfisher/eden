'use client'

import { OtherMessage } from '@/features/sessions/components/other-message'

interface NonStreamingMessageDisplayProps {
  sessionId: string
  waitingForResponse: boolean
  getRespondingAgents: () => Array<{
    _id: string
    username: string
    name: string
    userImage?: string | undefined
  }>
}

export const NonStreamingMessageDisplay: React.FC<NonStreamingMessageDisplayProps> = ({
  sessionId,
  waitingForResponse,
  getRespondingAgents,
}) => {
  if (!waitingForResponse) {
    return null
  }

  const respondingAgents = getRespondingAgents()

  return (
    <div className="mb-4">
      {respondingAgents.map((agent, index) => (
        <OtherMessage
          key={`loading-${agent._id}-${index}`}
          sessionId={sessionId}
          message={
            {
              _id: `loading-${agent._id}-${index}`,
              content: '',
              sender: agent,
              createdAt: new Date(),
              updatedAt: new Date(),
              session: sessionId,
              role: 'assistant',
            } as any
          }
          showAvatar={true}
          isStreamingTokens={true} // This will show the loading indicator
        />
      ))}
    </div>
  )
}