import { useCallback, useState } from 'react'

export const useEdenMessages = <TMessage extends { id: string }>({
  stream,
}: {
  stream: (messages: TMessage[]) => Promise<AsyncGenerator<{ data: TMessage }>>
}) => {
  const [messages, setMessages] = useState<TMessage[]>([])

  const sendMessage = useCallback(
    async (newMessages: TMessage[]) => {
      console.log('useEdenMessages - sendMessage - newMessages', newMessages)
      const optimisticMessages = [...messages, ...newMessages]

      if (newMessages.length > 0) {
        setMessages(optimisticMessages)
      }

      const response = await stream(newMessages)

      for await (const message of response) {
        setMessages(currentMessages => {
          const index = currentMessages.findIndex(m => m.id === message.data.id)
          if (index !== -1) {
            // Update existing message
            const updatedMessages = [...currentMessages]
            updatedMessages[index] = message.data
            return updatedMessages
          } else {
            // Add new message
            return [...currentMessages, message.data]
          }
        })
      }
    },
    [messages, stream],
  )

  return { messages, sendMessage, setMessages }
}
