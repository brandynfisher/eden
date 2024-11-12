import { EdenMessage } from '@/features/chat/convertEdenMessages'
import {
  AssistantMessage,
  ThreadsCreateResponse,
  ThreadsGetResponse,
  UserMessage,
} from '@edenlabs/eden-sdk'
import axios, { AxiosResponse } from 'axios'

export const createThread = async () => {
  // const client = createClient();
  // return client.threads.create();
  console.log('createThread')
  return {
    thread_id: '1234567890',
  }
}

export const getThread = async (threadId: string) => {
  console.log('getThread', threadId)

  const response: AxiosResponse<ThreadsGetResponse> = await axios.get(
    `/api/threads/${threadId}`,
  )

  // console.log(response)

  if (!response || !response.data.thread) {
    throw new Error('Thread not found')
  }

  return response.data.thread
}

// export const getThreadState = async (
//   threadId: string,
// ): Promise<ThreadState<Record<string, unknown>>> => {
//   // const client = createClient();
//   // return client.threads.getState(threadId);
//   console.log('getThreadState', threadId);
// };

// export const updateState = async (
//   threadId: string,
//   fields: {
//     newState: Record<string, unknown>;
//     asNode?: string;
//   },
// ) => {
//   console.log('updateState', threadId, fields)
//   // const client = createClient();
//   // return client.threads.updateState(threadId, {
//   //   values: fields.newState,
//   //   asNode: fields.asNode!,
//   // });
// };

export const sendMessage = async function* (params: {
  threadId: string
  agentId: string
  messages: EdenMessage[]
}) {
  console.log('sendMessage', params)

  const userMessage = params.messages[params.messages.length - 1] as UserMessage

  const response: AxiosResponse<ThreadsCreateResponse> = await axios.post(
    '/api/tasks/create',
    {
      workflow: 'chat',
      args: {
        agent_id: params.agentId,
        thread_id: params.threadId,
        content: userMessage.content,
        attachments: userMessage.attachments,
      },
    },
    // {
    //   signal: abortSignal,
    // },
  )

  await new Promise(resolve => setTimeout(resolve, 5000))

  console.log({ response })

  const failureMessage: AssistantMessage = {
    role: 'assistant',
    content: `Failed response!`,
  }

  console.log('yielding', {
    data: failureMessage,
  })

  yield {
    data: failureMessage,
  }
  //
  //
  // console.log('yielding', {
  //   data: userMessage,
  // })
  //
  // yield {
  //   data: userMessage,
  // }
}
