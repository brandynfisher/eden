'use client'

import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  ChatModelRunResult,
  MessageStatus,
  ThreadAssistantContentPart,
  useLocalRuntime,
} from '@assistant-ui/react'
import type { ReactNode } from 'react'

const MyModelAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal, config }) {
    console.log('ModelAdapter::run', { messages, config })

    // TODO replace with your own API
    const response = await fetch('<YOUR_API_ENDPOINT>', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages /* .... */ }),
      // if the user hits the "cancel" button or escape keyboard key, cancel the request
      signal: abortSignal,
    })

    const data = await response.json()

    const contentParts: ThreadAssistantContentPart[] = [
      {
        type: 'text',
        text: data.text,
      },
    ]

    // {type: "running"} |
    // {type: "requires-action", reason: "tool-calls"} |
    // {type: "complete", reason: "stop" | "unknown"} |
    // {type: "incomplete", reason: "cancelled" | "tool-calls" | "length" | "content-filter" | "other" | "error", error?: unknown}
    const messageStatus: MessageStatus = { type: 'complete', reason: 'stop' }

    const result: ChatModelRunResult = {
      content: contentParts,
      status: messageStatus,
      // metadata: {
      //   roundtrips: [], // ThreadRoundtrip[]
      //   custom: {} // Record<string, unknown> | undefined
      // }
    }

    return result
  },
}

export function AssistantUiCustomProvider({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const runtime = useLocalRuntime(MyModelAdapter)

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}
