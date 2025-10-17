import { EdenMessage } from '@/features/sessions/components/eden-message-converter'
import {
  ThreadUserMessage,
  ThreadsGetResponse,
  ThreadsMessageResponse,
} from '@edenlabs/eden-sdk'
import axios, { AxiosResponse } from 'axios'

export const createThread = async () => {
  // const client = createClient();
  // return client.threads.create();
  alert('createThread: Not Implemented')
  return {
    thread_id: '1234567890',
  }
}

export const getSession = async (sessionId: string) => {
  const response = await axios.get(`/api/sessions/${sessionId}`)

  if (!response || !response.data.session) {
    throw new Error('Session not found')
  }

  return response.data.session
}

export const getThread = async (threadId: string) => {
  const response: AxiosResponse<ThreadsGetResponse> = await axios.get(
    `/api/threads/${threadId}`,
  )

  if (!response || !response.data.thread) {
    throw new Error('Thread not found')
  }

  return response.data.thread
}

export const sendMessage = async function (params: {
  threadId?: string
  agentId: string
  messages: EdenMessage[]
  abortSignal?: AbortSignal | undefined
}): Promise<AxiosResponse<ThreadsMessageResponse>> {
  const { threadId, agentId, messages, abortSignal } = params
  const userMessage = messages[messages.length - 1] as ThreadUserMessage

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
    return response.data
  } catch (e) {
    console.error(e)
    return null
  }
}

export const unpinMessage = async (messageId: string) => {
  try {
    const response: AxiosResponse<ThreadsMessageResponse> = await axios.post(
      `/api/threads/unpin`,
      { message_id: messageId },
    )

    return response.data
  } catch (e) {
    console.error(e)
    return null
  }
}
