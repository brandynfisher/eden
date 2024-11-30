import { EdenMessage } from '@/features/chat/convertEdenMessages'
import {
  ThreadsCreateResponse,
  ThreadsGetResponse,
  UserMessage,
} from '@edenlabs/eden-sdk'
import axios, { AxiosResponse } from 'axios'

export const createThread = async () => {
  // const client = createClient();
  // return client.threads.create();
  alert('createThread: Not Implemented')
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

export const sendMessage = async function* (params: {
  threadId: string
  agentId: string
  messages: EdenMessage[]
  abortSignal: AbortSignal | undefined
}): AsyncGenerator<{ data: EdenMessage }, void, unknown> {
  console.log('sendMessage', params)

  const userMessage = params.messages[params.messages.length - 1] as UserMessage

  const response: AxiosResponse<ThreadsCreateResponse> = await axios.post(
    '/api/chat',
    {
      tool: 'chat',
      args: {
        agent_id: params.agentId,
        thread_id: params.threadId,
        content: userMessage.content,
        attachments: userMessage.attachments,
      },
    },
    {
      signal: params.abortSignal,
    },
  )

  if (response.status !== 200) {
    const errorMessage: EdenMessage = {
      role: 'assistant',
      content: `Failed response!`,
      status: { type: 'incomplete', reason: 'error' },
    }

    yield {
      data: errorMessage,
    }
    return
  }
}
