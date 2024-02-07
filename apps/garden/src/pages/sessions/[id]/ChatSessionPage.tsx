import ChatScenarioUI from '@/components/Scenarios/Chat/ChatScenarioUI'
import { useSession } from '@/hooks/useSession'
import { Session } from '@edenlabs/eden-sdk'
import React from 'react'

const ChatSessionPage = ({ data }: { data: Session }) => {
  const { session: sessionData } = useSession(data ? data.id : null, {
    fallbackData: data,
    revalidateOnFocus: false,
  })

  if (!sessionData) {
    return null
  }

  return <ChatScenarioUI session={sessionData} />
}

export default ChatSessionPage
