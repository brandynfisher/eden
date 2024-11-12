'use client'

import { createThread, getThread, sendMessage } from '@/features/chat/chatApi'
import { useEdenRuntime } from '@/features/chat/hooks/useEdenRuntime'
import { AssistantRuntimeProvider } from '@assistant-ui/react'
import { ReactNode, useRef } from 'react'

const agentId = '67170abeb539c335ad24067a'

export function EdenRuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const threadIdRef = useRef<string | undefined>()
  const runtime = useEdenRuntime({
    threadId: threadIdRef.current,
    stream: async messages => {
      if (!threadIdRef.current) {
        const { thread_id } = await createThread()
        threadIdRef.current = thread_id
      }

      const threadId = threadIdRef.current
      return sendMessage({
        threadId,
        agentId,
        messages,
      })
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread()
      threadIdRef.current = thread_id
    },
    onSwitchToThread: async threadId => {
      const thread = await getThread(threadId)
      threadIdRef.current = threadId
      return {
        messages: thread.messages,
      }
    },
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}
