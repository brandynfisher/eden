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

// const wrappedAdapter = (socket?: WebSocket): ChatModelAdapter => {
//   console.log({socket})
//
//   return {
//     async* run({ messages, abortSignal, config }) {
//       console.log('ModelAdapter::run', { messages, config })
//
//       try {
//         const response: AxiosResponse<ThreadsCreateResponse> = await axios.post('/api/tasks/create', {
//           workflow: 'chat',
//           args: {
//             agent_id: agentId,
//             thread_id: threadId,
//             content: (messages[messages.length - 1].content[0] as TextContentPart).text,
//             // attachments,
//           },
//         }, {
//           signal: abortSignal,
//         })
//
//         console.log(response)
//
//         if (response.status !== 200) {
//           const errorResult: ChatModelRunResult = {
//             status: {
//               type: 'incomplete',
//               reason: 'error',
//             },
//             content: [
//               {
//                 type: 'text',
//                 text: `Failed response: ${response.data.error} - ${response.data.message}`,
//               },
//             ],
//           }
//           yield errorResult
//           return
//         }
//
//         const pendingResult: ChatModelRunResult = {
//           status: {
//             type: 'running',
//           },
//           content: [
//             {
//               type: 'text',
//               text: 'Eve is thinking...',
//             },
//           ],
//         }
//
//         yield pendingResult
//
//
//         const websocketResult = await new Promise<ChatModelRunResult>((resolve, reject) => {
//           const messageHandler = (event: MessageEvent) => {
//             const data = JSON.parse(event.data)
//
//             if (data.event === 'thread-update') {
//               // Cleanup the listener since the event is received
//               socket?.removeEventListener('message', messageHandler)
//               resolve({
//                 status: {
//                   type: 'complete',
//                   reason: 'stop',
//                 },
//                 content: [
//                   {
//                     type: 'text',
//                     text: `Thread updated: ${JSON.stringify(data.data)}`,
//                   },
//                 ],
//               })
//             }
//           }
//
//           // Add the event listener
//           socket?.addEventListener('message', messageHandler)
//
//           abortSignal.addEventListener('abort', () => {
//             socket?.removeEventListener('message', messageHandler)
//             reject(new Error('Operation aborted'))
//           })
//         })
//
//         yield websocketResult
//
//         // await new Promise((resolve) => setTimeout(resolve, 2000))
//         //
//         // const dummyWebsocketResult: ChatModelRunResult = {
//         //   status: {
//         //     type: 'complete',
//         //     reason: 'stop',
//         //   },
//         //   content: [
//         //     {
//         //       type: 'text',
//         //       text: 'DUMMY RESULT',
//         //     },
//         //   ],
//         // }
//         //
//         // yield dummyWebsocketResult
//
//       } catch (e) {
//         const error = e as { message?: string, response?: { data?: { message?: { detail?: string } } } }
//         console.log(error)
//         const errorResult: ChatModelRunResult = {
//           status: {
//             type: 'incomplete',
//             reason: 'error',
//           },
//           content: [
//             {
//               type: 'ui',
//               display: (
//                 <Alert variant='destructive'>
//                   <AlertTitle>Failed response!</AlertTitle>
//                   <AlertDescription className='flex flex-col gap-2'>
//                     <div>
//                       Axios: {error?.message}
//                     </div>
//                     <Separator />
//                     <div>
//                       Modal: {JSON.stringify(error?.response?.data?.message)}
//                     </div>
//                   </AlertDescription>
//                 </Alert>
//               ),
//             },
//           ],
//         }
//
//         yield errorResult
//         return
//       }
//
//
//       // Yield initial running status (loading ui)
//       // const initialStatus: MessageStatus = { type: 'running' }
//       // const loadingContentParts: ThreadAssistantContentPart[] = [
//       //   {
//       //     type: 'ui',
//       //     display: <Loader2Icon className='animate-spin'/>,
//       //   },
//       // ]
//       // const initialResult: ChatModelRunResult = {
//       //   status: initialStatus,
//       //   content: loadingContentParts
//       // }
//       // yield initialResult
//
//       // await new Promise((resolve) => setTimeout(resolve, 2000))
//       //
//       // const args = {
//       //   query: messages[messages.length - 1].content[0],
//       // }
//       // const websearchResultContent: ToolCallContentPart = {
//       //   type: 'tool-call',
//       //   toolName: 'web_search',
//       //   toolCallId: '123123',
//       //   args: args,
//       //   argsText: JSON.stringify(args),
//       //   result: '{"title": "search result title", "description": "search result description", "url": "search result url"}',
//       //   isError: false,
//       // }
//       //
//       // const websearchResult: ChatModelRunResult = {
//       //   status: { type: 'running' },
//       //   content: [websearchResultContent]
//       // }
//       //
//       // yield websearchResult
//
//
//       // dummy delay to simulate progress
//       // await new Promise((resolve) => setTimeout(resolve, 2000))
//       //
//       // const initialStatus: MessageStatus = { type: 'running' }
//       // const initialResponseContentPart: ThreadAssistantContentPart = {
//       //   type: 'text',
//       //   text: `Here is our conversation history so far:`
//       // }
//       // const initialResult: ChatModelRunResult = {
//       //   status: initialStatus,
//       //   content: [websearchResultContent, initialResponseContentPart]
//       // }
//       // yield initialResult
//       // // Prepare final content and status
//       //
//       // await new Promise((resolve) => setTimeout(resolve, 2000))
//       //
//       // //DEV: echo back messages
//       // const echoMessagesContentPart: ThreadAssistantContentPart = {
//       //   type: 'text',
//       //   text: `\`\`\`Messages ${JSON.stringify(messages, null, 2)} `
//       // }
//       //
//       // const finalStatus: MessageStatus = { type: 'complete', reason: 'stop' }
//       // const contentParts: ThreadAssistantContentPart[] = [
//       //   websearchResultContent,
//       //   initialResponseContentPart,
//       //   echoMessagesContentPart,
//       // ]
//       // const finalResult: ChatModelRunResult = {
//       //   content: contentParts,
//       //   status: finalStatus,
//       // }
//
//       // Yield final result
//       // yield finalResult
//     },
//   }
// }
//
// // const MyModelAdapter: ChatModelAdapter = {
// //   async* run({ messages, abortSignal, config }) {
// //     console.log('ModelAdapter::run', { messages, config })
// //
// //     try {
// //       const response: AxiosResponse<ThreadsCreateResponse> = await axios.post('/api/tasks/create', {
// //         workflow: 'chat',
// //         args: {
// //           agent_id: agentId,
// //           thread_id: threadId,
// //           content: (messages[messages.length - 1].content[0] as TextContentPart).text,
// //           // attachments,
// //         },
// //       }, {
// //         signal: abortSignal,
// //       })
// //
// //       console.log(response)
// //
// //       if (response.status !== 200) {
// //         const errorResult: ChatModelRunResult = {
// //           status: {
// //             type: 'incomplete',
// //             reason: 'error',
// //           },
// //           content: [
// //             {
// //               type: 'text',
// //               text: `Failed response: ${response.data.error} - ${response.data.message}`,
// //             },
// //           ],
// //         }
// //         yield errorResult
// //         return
// //       }
// //
// //       const pendingResult: ChatModelRunResult = {
// //         status: {
// //           type: 'running',
// //         },
// //         content: [
// //           {
// //             type: 'text',
// //             text: 'Eve is thinking...',
// //           },
// //         ],
// //       }
// //
// //       yield pendingResult
// //
// //
// //       await new Promise((resolve) => setTimeout(resolve, 2000))
// //
// //       const dummyWebsocketResult: ChatModelRunResult = {
// //         status: {
// //           type: 'complete',
// //           reason: 'stop',
// //         },
// //         content: [
// //           {
// //             type: 'text',
// //             text: 'DUMMY RESULT',
// //           },
// //         ],
// //       }
// //
// //       yield dummyWebsocketResult
// //
// //     } catch (e) {
// //       const error = e as { message?: string, response?: { data?: { message?: { detail?: string } } } }
// //       console.log(error)
// //       const errorResult: ChatModelRunResult = {
// //         status: {
// //           type: 'incomplete',
// //           reason: 'error',
// //         },
// //         content: [
// //           {
// //             type: 'ui',
// //             display: (
// //               <Alert variant='destructive'>
// //                 <AlertTitle>Failed response!</AlertTitle>
// //                 <AlertDescription className='flex flex-col gap-2'>
// //                   <div>
// //                     Axios: {error?.message}
// //                   </div>
// //                   <Separator />
// //                   <div>
// //                     Modal: {JSON.stringify(error?.response?.data?.message)}
// //                   </div>
// //                 </AlertDescription>
// //               </Alert>
// //             ),
// //           },
// //         ],
// //       }
// //
// //       yield errorResult
// //       return
// //     }
// //
// //
// //     // Yield initial running status (loading ui)
// //     // const initialStatus: MessageStatus = { type: 'running' }
// //     // const loadingContentParts: ThreadAssistantContentPart[] = [
// //     //   {
// //     //     type: 'ui',
// //     //     display: <Loader2Icon className='animate-spin'/>,
// //     //   },
// //     // ]
// //     // const initialResult: ChatModelRunResult = {
// //     //   status: initialStatus,
// //     //   content: loadingContentParts
// //     // }
// //     // yield initialResult
// //
// //     // await new Promise((resolve) => setTimeout(resolve, 2000))
// //     //
// //     // const args = {
// //     //   query: messages[messages.length - 1].content[0],
// //     // }
// //     // const websearchResultContent: ToolCallContentPart = {
// //     //   type: 'tool-call',
// //     //   toolName: 'web_search',
// //     //   toolCallId: '123123',
// //     //   args: args,
// //     //   argsText: JSON.stringify(args),
// //     //   result: '{"title": "search result title", "description": "search result description", "url": "search result url"}',
// //     //   isError: false,
// //     // }
// //     //
// //     // const websearchResult: ChatModelRunResult = {
// //     //   status: { type: 'running' },
// //     //   content: [websearchResultContent]
// //     // }
// //     //
// //     // yield websearchResult
// //
// //
// //     // dummy delay to simulate progress
// //     // await new Promise((resolve) => setTimeout(resolve, 2000))
// //     //
// //     // const initialStatus: MessageStatus = { type: 'running' }
// //     // const initialResponseContentPart: ThreadAssistantContentPart = {
// //     //   type: 'text',
// //     //   text: `Here is our conversation history so far:`
// //     // }
// //     // const initialResult: ChatModelRunResult = {
// //     //   status: initialStatus,
// //     //   content: [websearchResultContent, initialResponseContentPart]
// //     // }
// //     // yield initialResult
// //     // // Prepare final content and status
// //     //
// //     // await new Promise((resolve) => setTimeout(resolve, 2000))
// //     //
// //     // //DEV: echo back messages
// //     // const echoMessagesContentPart: ThreadAssistantContentPart = {
// //     //   type: 'text',
// //     //   text: `\`\`\`Messages ${JSON.stringify(messages, null, 2)} `
// //     // }
// //     //
// //     // const finalStatus: MessageStatus = { type: 'complete', reason: 'stop' }
// //     // const contentParts: ThreadAssistantContentPart[] = [
// //     //   websearchResultContent,
// //     //   initialResponseContentPart,
// //     //   echoMessagesContentPart,
// //     // ]
// //     // const finalResult: ChatModelRunResult = {
// //     //   content: contentParts,
// //     //   status: finalStatus,
// //     // }
// //
// //     // Yield final result
// //     // yield finalResult
// //   },
// // }

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
          workflow: 'chat',
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
