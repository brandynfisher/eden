import { AxiosRequestConfig } from 'axios'

import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../EdenClient'
import { transformArgsIntoURLParams } from '../methods'
import { Generator } from './Generators'

// Arguments

export interface TasksCreateArguments extends WebAPICallOptions {
  generatorName: string
  versionId?: string
  config?: any
  metadata?: any
  webhooks?: string[]
  attributes?: TaskAttributes
}

export interface TasksCompleteArguments extends WebAPICallOptions {
  prompt: string
  config?: any
}

export interface TasksChatCompleteArguments extends WebAPICallOptions {
  chat: any[]
  config?: any
}

export interface TasksListArguments extends WebAPICallOptions, ListQueryParams {
  status?: string | string[]
  taskId?: string | string[]
}

export interface TasksGetArguments extends WebAPICallOptions {
  taskId: string
}

// Requests

export const tasksCreateRequestConfig = (
  args: TasksCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'tasks/create',
    data: {
      ...args,
    },
  }
}

export const tasksCostRequestConfig = (
  args: TasksCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'tasks/cost',
    data: {
      ...args,
    },
  }
}

export const tasksCompleteRequestConfig = (
  args: TasksCompleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'tasks/complete',
    data: {
      ...args,
    },
  }
}

export const tasksChatCompleteRequestConfig = (
  args: TasksChatCompleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'tasks/chat',
    data: {
      ...args,
    },
  }
}

export const tasksListRequestConfig = (
  args: TasksListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'tasks',
    params,
  }
}

export const tasksGetRequestConfig = (
  args: TasksGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `tasks/${args.taskId}`,
  }
}

// Responses

export type TasksCreateResponse = WebAPICallResult & {
  error?: string
  taskId?: string
}

export type TasksCompleteResponse = WebAPICallResult & {
  error?: string
  completion?: Completion
}

export type TasksListResponse = WebAPICallResult &
  PaginatedResponse<Task> & {
    error?: string
  }

export type TasksGetResponse = WebAPICallResult & {
  error?: string
  task?: Task
}

// Types

export type Task = {
  _id: string
  user: string
  character?: string
  generator: Generator
  versionId: string
  config?: any
  metadata?: any
  cost: number
  taskId: string
  status: string
  error?: string
  progress?: number
  output?: any
  intermediate_outputs?: any[]
  creation?: any
  samples?: any[]
  concept?: string
  attributes?: TaskAttributes
  createdAt: string
  updatedAt: string
}

export type Completion = {
  id: string
  text: string
}

export interface TaskAttributes {
  discordId?: string
  delegateUserId?: string
}
