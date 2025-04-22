import { EdenMessage } from '@/features/chat/eden-message-converter'
import {
  ThreadsGetResponse,
  ThreadsMessageResponse,
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

export const sendMessage = async function (params: {
  threadId?: string
  agentId: string
  messages: EdenMessage[]
  abortSignal: AbortSignal | undefined
}): Promise<AxiosResponse<ThreadsMessageResponse>> {
  // console.log('sendMessage', params)

  const { threadId, agentId, messages, abortSignal } = params
  const userMessage = messages[messages.length - 1] as UserMessage

  const response: AxiosResponse<ThreadsMessageResponse> = await axios.post(
    '/api/threads',
    {
      agent_id: agentId,
      thread_id: threadId,
      content: userMessage.content,
      attachments: userMessage.attachments,
    },
    {
      signal: abortSignal,
    },
  )

  return response
}

export const pinMessage = async (messageId: string) => {
  try {
    const response: AxiosResponse<ThreadsMessageResponse> = await axios.post(
      `/api/threads/pin`,
      { message_id: messageId },
    )
    console.log(response)
    return response.data
  } catch (e) {
    console.error(e)
    return null
  }
}

export const unpinMessage = async (threadId: string, messageId: string) => {
  try {
    const response: AxiosResponse<ThreadsMessageResponse> = await axios.post(
      `/api/threads/unpin`,
      { thread_id: threadId, message_id: messageId },
    )
    console.log(response)
    return response.data
  } catch (e) {
    console.error(e)
    return null
  }
}
