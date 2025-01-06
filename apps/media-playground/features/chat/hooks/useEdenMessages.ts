import { useCallback, useState } from 'react'

export const useEdenMessages = <TMessage extends { id: string }>({
  stream,
}: {
  stream: (
    messages: TMessage[],
    callback?: (thread_id?: string) => Promise<void>,
  ) => Promise<AsyncGenerator<{ data: TMessage }>>
}) => {
  const [messages, setMessages] = useState<TMessage[]>([])

  const addOrUpdateMessage = useCallback((message: TMessage) => {
    setMessages(currentMessages => {
      const index = currentMessages.findIndex(m => m.id === message.id)
      if (index !== -1) {
        console.log('update msg', index, message.id, message)

        // Update existing message
        const updatedMessages = [...currentMessages]
        updatedMessages[index] = message
        return updatedMessages
      } else {
        // find prior running message and update it to {type: 'complete', reason: 'stop'}
        const priorRunning = currentMessages.find(
          m => m.status?.type === 'running',
        )
        console.log('priorRunning', priorRunning)

        // make this work with potentially multiple prior running messages
        const priorRunningMessages = currentMessages.filter(
          m => m.status?.type === 'running',
        )
        if (priorRunningMessages.length > 0) {
          const updatedMessages = [...currentMessages]
          priorRunningMessages.forEach(m => {
            const index = updatedMessages.findIndex(m => m.id === m.id)
            updatedMessages[index] = {
              ...m,
              status: { type: 'complete', reason: 'stop' },
            }
          })
          console.log(
            'add new, update prior running',
            index,
            priorRunningMessages,
            message.id,
            message,
          )
          return [...updatedMessages, message]
        }

        console.log('add new', index, message.id, message)
        // Add new message
        return [...currentMessages, message]
      }
    })
  }, [])

  const sendMessage = useCallback(
    async (newMessages: TMessage[], callback?: () => Promise<void>) => {
      const optimisticMessages = [...messages, ...newMessages]

      if (newMessages.length > 0) {
        setMessages(optimisticMessages)
      }

      const response = await stream(newMessages, callback)
      console.log('useEdenMessages: stream response:', response)

      for await (const message of response) {
        // addOrUpdateMessage(message.data)
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

  return {
    messages,
    sendMessage,
    setMessages,
    addOrUpdateMessage,
  }
}
