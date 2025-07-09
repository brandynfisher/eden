'use client'

import { Message } from '@edenlabs/eden-sdk'
import { sessionConfig } from '@/lib/config'

interface UseSessionMessageHandlerProps {
  sessionId: string
  user: any // Replace with proper user type
  clearErrors: () => void
  setCancelledNotice: (value: boolean) => void
  getRespondingAgent: () => {
    _id: string
    username: string
    name: string
    userImage?: string | undefined
  }
  scrollToBottom: () => void
  
  // Streaming props
  initializeStreaming?: () => void
  sendStreamingMessage?: (content: string, attachments?: string[]) => void
  
  // Non-streaming props  
  setWaitingForResponse?: (value: boolean) => void
  setOptimisticMessages?: React.Dispatch<React.SetStateAction<Message[]>>
  sendNonStreamingMessage?: (content: string, attachments?: string[]) => void
}

export const useSessionMessageHandler = ({
  sessionId,
  user,
  clearErrors,
  setCancelledNotice,
  getRespondingAgent,
  scrollToBottom,
  initializeStreaming,
  sendStreamingMessage,
  setWaitingForResponse,
  setOptimisticMessages,
  sendNonStreamingMessage,
}: UseSessionMessageHandlerProps) => {
  const handleStreamingMessage = (content: string, attachments?: string[]) => {
    clearErrors()
    setCancelledNotice(false)

    if (sessionConfig.useStreaming) {
      // Streaming mode
      if (initializeStreaming && sendStreamingMessage && setOptimisticMessages) {
        initializeStreaming()
        sendStreamingMessage(content, attachments)

        // Add optimistic messages
        setOptimisticMessages(prev => [
          ...prev,
          {
            _id: `optimistic-user-${Date.now()}`,
            content: content,
            sender: {
              _id: user?._id || 'user',
              username: user?.username || 'User',
              name: user?.username || 'You',
              userImage: user?.userImage,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            session: sessionId,
            role: 'user',
          } as Message,
          {
            _id: `optimistic-agent-${Date.now()}`,
            content: '',
            sender: getRespondingAgent(),
            createdAt: new Date(),
            updatedAt: new Date(),
            session: sessionId,
            role: 'assistant',
            __optimistic: true,
          } as Message,
        ])

        setTimeout(scrollToBottom, 100)
      }
    } else {
      // Non-streaming mode
      if (setWaitingForResponse && setOptimisticMessages && sendNonStreamingMessage) {
        setWaitingForResponse(true)

        const userMessage: Message = {
          _id: `optimistic-user-${Date.now()}`,
          content: content,
          sender: {
            _id: user?._id || 'user',
            username: user?.username || 'User',
            name: user?.username || 'You',
            userImage: user?.userImage,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          session: sessionId,
          role: 'user',
          attachments: attachments || [],
        } as Message

        setOptimisticMessages(prev => [...prev, userMessage])
        sendNonStreamingMessage(content, attachments)
        setTimeout(scrollToBottom, 100)
      }
    }
  }

  return { handleStreamingMessage }
}