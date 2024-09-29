import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { Creator } from '../Creators'
import { AxiosRequestConfig } from 'axios'

// Arguments
export interface ThreadsCreateArguments extends WebAPICallOptions {}

export interface ThreadsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

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
    | { thread: Thread }
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

export type Thread = {
  _id: string
  user: Creator
  createdAt: Date
  updatedAt: Date
}
