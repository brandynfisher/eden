import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { Creator } from '../Creators'
import { TaskV2Args, TaskV2Result } from './TasksV2'
import { AxiosRequestConfig } from 'axios'

// Arguments
export interface ThreadsCreateArguments extends WebAPICallOptions {
  thread_id?: string
  agent_id?: string
  content: string
  attachments?: string[]
}

export interface ThreadsMessageArguments extends WebAPICallOptions {
  thread_id?: string
  agent_id?: string
  content: string
  attachments?: string[]
}

export interface ThreadsListArguments
  extends WebAPICallOptions,
    ListQueryParams {}

export interface ThreadsGetArguments extends WebAPICallOptions {
  thread_id: string
}

// Requests

export const threadsCreateRequestConfig = (
  args: ThreadsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/threads/create',
    data: {
      ...args,
    },
  }
}

export const threadsMessageRequestConfig = (
  args: ThreadsMessageArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/threads',
    data: {
      ...args,
    },
  }
}

export const threadsListRequestConfig = (
  args: ThreadsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/threads',
    params,
  }
}

export const threadsGetRequestConfig = (
  args: ThreadsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/threads/${args.thread_id}`,
  }
}

// Responses

export type ThreadsCreateResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { thread_id?: Thread['_id']; success: boolean }
  )

export type ThreadsMessageResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { thread_id?: Thread['_id']; success: boolean }
  )

export type ThreadsListResponse = WebAPICallResult &
  PaginatedResponse<Thread> & {
    error?: string
  }

export type ThreadsGetResponse = WebAPICallResult & {
  error?: string
  thread?: Thread
}

// Types

export type Message = {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  createdAt?: Date
}

export type UserMessageAttachments = string

export type UserMessage = Message & {
  role: 'user'
  // name: string
  content: string
  metadata?: { [key: string]: string | boolean | number }
  attachments?: UserMessageAttachments[]
}

export type ToolCall = {
  id: string
  name: string
  args: TaskV2Args
  result?: TaskV2Result[]
}

export type ThreadMessage = {
  role: 'user' | 'assistant' | 'tool' | 'system'
  content?: string
  tool_results?: {
    id: string
    name: string
    result: string
    error?: string
  }[]
  metadata?: {
    [key: string]: string | number | boolean | Date | null
  }
  attachments?: string[]
  createdAt: Date
}

export type ToolResults = {
  id: string
  name: string
  result: string
  error?: string
}

export type AssistantMessage = Message & {
  role: 'assistant'
  content: string
  tool_calls?: ToolCall[]
}

export type SystemMessage = Message & {
  role: 'system'
  content: string
}

// export type ToolMessage = Message & {
//   role: 'tool'
//   content?: string
//   tool_results: ToolResults[]
// }

export type Thread = {
  _id: string
  user: Creator
  name: string
  label: string
  // messages: (UserMessage | AssistantMessage | ToolMessage | SystemMessage)[]
  messages: (UserMessage | AssistantMessage | SystemMessage)[]
  createdAt: Date
  updatedAt: Date
}
