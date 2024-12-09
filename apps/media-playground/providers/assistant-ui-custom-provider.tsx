'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  JsonMessage,
  useWebSocketContext,
} from '@/providers/websocket-provider'
import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  ChatModelRunResult,
  SimpleImageAttachmentAdapter,
  TextContentPart,
  useLocalRuntime, // CompleteAttachment,
} from '@assistant-ui/react'
import { ThreadsCreateResponse } from '@edenlabs/eden-sdk'
import axios, { AxiosResponse } from 'axios'
import { ReactNode, useCallback, useEffect, useRef } from 'react'

const threadId = '672e7382c17b1b2c93d19a5a'
const agentId = '67170abeb539c335ad24067a'

export const useChatModelAdapter = (): ChatModelAdapter => {
  const { lastMessageJson } = useWebSocketContext()
  const threadUpdateRef = useRef<JsonMessage>()
  const abortSignalRef = useRef<AbortSignal>()

  useEffect(() => {
    lastMessageJson && console.log(lastMessageJson?.event)
    if (lastMessageJson?.event === 'thread-update') {
      threadUpdateRef.current = lastMessageJson
      console.log('updating thread', lastMessageJson)
    }
  }, [lastMessageJson])

  const run = useCallback<ChatModelAdapter['run']>(async function* ({
    messages,
    abortSignal,
  }) {
    abortSignalRef.current = abortSignal

    const userMessage = messages[messages.length - 1]
    const userMessageText = (userMessage.content[0] as TextContentPart)?.text
    // const userMessageAttachments = (userMessage.attachments as CompleteAttachment[]) || []

    console.log({ userMessage })
    try {
      const response: AxiosResponse<ThreadsCreateResponse> = await axios.post(
        '/api/tasks/create',
        {
          tool: 'chat',
          args: {
            agent_id: agentId,
            thread_id: threadId,
            content: userMessageText,
            attachments: [],
          },
        },
        {
          signal: abortSignal,
        },
      )

      console.log(response)

      if (response.status !== 200) {
        const failureResult: ChatModelRunResult = {
          status: {
            type: 'incomplete',
            reason: 'error',
          },
          content: [
            {
              type: 'text',
              text: `Failed response: ${response.data.error} - ${response.data.message}`,
            },
          ],
        }
        yield failureResult
        return
      }

      const waitForThreadUpdate = async (): Promise<ChatModelRunResult> => {
        return new Promise((resolve, reject) => {
          const checkUpdate = () => {
            console.log('checkUpdate', threadUpdateRef.current)
            if (threadUpdateRef.current) {
              const assistantMessage =
                threadUpdateRef?.current?.data?.thread?.messages[
                  threadUpdateRef.current.data.thread.messages.length - 1
                ].content

              resolve({
                status: {
                  type: 'complete',
                  reason: 'stop',
                },
                content: [
                  {
                    type: 'text',
                    text: assistantMessage || 'n/a',
                  },
                ],
              })
              threadUpdateRef.current = undefined // Clear the update after processing
            } else if (abortSignalRef.current?.aborted) {
              reject(new Error('Operation aborted'))
            } else {
              setTimeout(checkUpdate, 500) // Check again in 500ms
            }
          }
          checkUpdate()
        })
      }

      const websocketResult = await waitForThreadUpdate()
      yield websocketResult
    } catch (e) {
      const error = e as {
        message?: string
        response?: { data?: { message?: { detail?: string } } }
      }
      console.log(error)
      const failureResult: ChatModelRunResult = {
        status: {
          type: 'incomplete',
          reason: 'error',
        },
        content: [
          {
            type: 'ui',
            display: (
              <Alert variant="destructive">
                <AlertTitle>Failed response!</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <div>Axios: {error?.message}</div>
                  <Separator />
                  <div>
                    Modal: {JSON.stringify(error?.response?.data?.message)}
                  </div>
                </AlertDescription>
              </Alert>
            ),
          },
        ],
      }

      yield failureResult
      return
    }
  },
  [])

  return { run }
}

export function AssistantUiCustomProvider({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  // @todo: get thread list
  //

  const chatModelAdapter = useChatModelAdapter()
  const runtime = useLocalRuntime(chatModelAdapter, {
    initialMessages: [],
    adapters: {
      attachments: new SimpleImageAttachmentAdapter(),
      // threadList: {
      //   threadId,
      //   onSwitchToNewThread: !onSwitchToNewThread
      //     ? undefined
      //     : async () => {
      //       await onSwitchToNewThread();
      //       setMessages([]);
      //     },
      //   onSwitchToThread: !onSwitchToThread
      //     ? undefined
      //     : async (threadId) => {
      //       const { messages } = await onSwitchToThread(threadId);
      //       setMessages(messages);
      //     },
      // },
    },
  })
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  )
}
