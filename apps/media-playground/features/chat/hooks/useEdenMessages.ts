import { INTERNAL } from '@assistant-ui/react'
import { useCallback, useState } from 'react'

const { generateId } = INTERNAL

export const useEdenMessages = <TMessage>({
  stream,
}: {
  stream: (messages: TMessage[]) => Promise<AsyncGenerator<{ data: TMessage }>>
}) => {
  const [messages, setMessages] = useState<TMessage[]>([])

  console.log('useEdenMessages', messages)

  const sendMessage = useCallback(
    async (newMessages: TMessage[]) => {
      const optimisticMessages = [...messages, ...newMessages]

      console.log('optimisticMessages', newMessages, optimisticMessages)

      if (newMessages.length > 0) {
        setMessages(optimisticMessages)
      }

      const response = await stream(newMessages)

      console.log('response', response)

      const completeMessages: TMessage[] = []
      // let partialMessages: Map<string, TMessage> = new Map();
      for await (const message of response) {
        // if (chunk.event === "messages/partial") {
        //   // bug fix: messages/complete is not sent for some python langchain backends
        //   if (completeMessages.length === 0) {
        //     completeMessages.push(...optimisticMessages);
        //   }
        //
        //   for (const message of chunk.data) {
        //     if (!message.id) throw new Error("Partial message missing id");
        //
        //     partialMessages.set(message.id, message);
        //   }
        // } else if (chunk.event === "messages/complete") {
        //   for (const message of chunk.data) {
        //     if (message.id) {
        //       partialMessages.delete(message.id);
        //     }
        //
        //     // bug fix: tool results can arrive before the message is complete ?
        //     // if we have partial messages left, we add complete message to partial messages
        //     if (partialMessages.size > 0) {
        //       partialMessages.set(message.id ?? generateId(), message);
        //     } else {
        completeMessages.push({ ...message.data, id: generateId() })
        // }
        // }
        // } else {
        //   continue;
        // }

        setMessages(currentMessages => [
          ...currentMessages,
          ...completeMessages,
        ])
      }
      // if (partialMessages.size > 0) {
      //   throw new Error("A partial message was not marked as complete");
      // }
    },
    [messages, stream],
  )

  return { messages, sendMessage, setMessages }
}
