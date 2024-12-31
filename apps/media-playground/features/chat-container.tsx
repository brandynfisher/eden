'use client'

import Chat from '@/features/chat/chat'
import { FC } from 'react'

type Props = {
  agentId: string
  threadId?: string
}

export const ChatContainer: FC<Props> = ({ agentId, threadId }) => {
  return <Chat agentId={agentId} threadId={threadId} />
}
