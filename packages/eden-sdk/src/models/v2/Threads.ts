import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { Creator } from '../Creators'
import { TaskV2Args } from './TasksV2'
import { AxiosRequestConfig } from 'axios'

// Arguments
export interface ThreadsCreateArguments extends WebAPICallOptions {
  threadId?: string
  agentId?: string
  content: string
  attachments?: string[]
}

export interface ThreadsListArguments
  extends WebAPICallOptions,
    ListQueryParams {}

export interface ThreadsGetArguments extends WebAPICallOptions {
  threadId: string
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

export const threadsListRequestConfig = (
  args: ThreadsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/tasks',
    params,
  }
}

export const threadsGetRequestConfig = (
  args: ThreadsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/threads/${args.threadId}`,
  }
}

// Responses

export type ThreadsCreateResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { threadId?: Thread['_id']; success: boolean }
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
  role?: 'user' | 'assistant' | 'tool'
  createdAt: Date
}

export type UserMessage = Message & {
  role?: 'user'
  // name: string
  content: string
  metadata?: { [key: string]: string | boolean | number }
  attachments?: string[]
}

export type ToolCall = {
  id: string
  name: string
  input: TaskV2Args
}

export type ToolResults = {
  id: string
}

export type AssistantMessage = Message & {
  role?: 'assistant'
  content: string
  tool_calls?: ToolCall[]
}

export type ToolMessage = Message & {
  role?: 'tool'
  tool_results: ToolResults[]
}

export type Thread = {
  _id: string
  user: Creator
  name: string
  messages: (UserMessage | AssistantMessage)[]
  createdAt: Date
  updatedAt: Date
}
