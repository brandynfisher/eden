'use client'

import { OtherMessage } from '@/features/sessions/components/other-message'

interface NonStreamingMessageDisplayProps {
  sessionId: string
  waitingForResponse: boolean
  getRespondingAgent: () => {
    _id: string
    username: string
    name: string
    userImage?: string | undefined
  }
}

export const NonStreamingMessageDisplay: React.FC<NonStreamingMessageDisplayProps> = ({
  sessionId,
  waitingForResponse,
  getRespondingAgent,
}) => {
  if (!waitingForResponse) {
    return null
  }

  return (
    <div className="mb-4">
      <OtherMessage
        sessionId={sessionId}
        message={
          {
            _id: 'loading',
            content: '',
            sender: getRespondingAgent(),
            createdAt: new Date(),
            updatedAt: new Date(),
            session: sessionId,
            role: 'assistant',
          } as any
        }
        showAvatar={true}
        isStreamingTokens={true} // This will show the loading indicator
      />
    </div>
  )
}