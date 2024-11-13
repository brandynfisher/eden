import { INTERNAL } from '@assistant-ui/react'
import { useCallback, useState } from 'react'

const { generateId } = INTERNAL

export const useEdenMessages = <TMessage>({
  stream,
}: {
  stream: (messages: TMessage[]) => Promise<AsyncGenerator<{ data: TMessage }>>
}) => {
  const [messages, setMessages] = useState<TMessage[]>([])

  // console.log('useEdenMessages', messages)

  const sendMessage = useCallback(
    async (newMessages: TMessage[]) => {
      const optimisticMessages = [...messages, ...newMessages]

      // console.log('useEdenMessages - sendMessage - messages', messages)
      // console.log('useEdenMessages - sendMessage - newMessages', newMessages)

      if (newMessages.length > 0) {
        setMessages(optimisticMessages)
      }

      const response = await stream(newMessages)

      const completeMessages: TMessage[] = []
      // let partialMessages: Map<string, TMessage> = new Map();
      for await (const message of response) {
        // console.log('useEdenMessages - sendMessage - stream response', message)
        completeMessages.push({ ...message.data, id: generateId() })
      }

      setMessages(currentMessages => [...currentMessages, ...completeMessages])
    },
    [messages, stream],
  )

  return { messages, sendMessage, setMessages }
}
