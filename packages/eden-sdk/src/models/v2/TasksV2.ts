import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { MediaAttributes } from '../Media'
import { CreationV2 } from './CreationsV2'
import { TaskV2Status } from 'api/src/models/v2/TaskV2'
import { AxiosRequestConfig } from 'axios'

// Arguments
export interface TasksV2CreateArguments extends WebAPICallOptions {
  workflow: string
  args?: any
}

export interface TasksV2ListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  taskId?: string | string[]
  status?: string | string[]
  type?: 'concepts' | 'creations'
  workflow?: string
}

export interface TasksV2GetArguments extends WebAPICallOptions {
  taskId: string
}

export interface TasksV2CancelArguments extends WebAPICallOptions {
  taskId: string
}

export interface TasksV2PublishArguments extends WebAPICallOptions {
  taskId: string
  resultUrl: string
}

export type TaskV2Result = {
  url?: string
  thumbnail?: string
  metadata?: string | null
  mediaAttributes?: MediaAttributes
  published?: boolean
  model?: string
}

// Requests

export const tasksV2CreateRequestConfig = (
  args: TasksV2CreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/tasks/create',
    data: {
      ...args,
    },
  }
}

export const tasksV2CostRequestConfig = (
  args: TasksV2CreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/tasks/cost',
    data: {
      ...args,
    },
  }
}

export const tasksV2ListRequestConfig = (
  args: TasksV2ListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/tasks',
    params,
  }
}

export const tasksV2GetRequestConfig = (
  args: TasksV2GetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/tasks/${args.taskId}`,
  }
}

export const tasksV2CancelRequestConfig = (
  args: TasksV2CancelArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/tasks/cancel',
    data: {
      ...args,
    },
  }
}

export const tasksV2PublishRequestConfig = (
  args: TasksV2PublishArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/tasks/publish',
    data: {
      ...args,
    },
  }
}

// Responses

export type TasksV2CreateResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { task: TaskV2 }
  )

export type TasksV2ListResponse = WebAPICallResult &
  PaginatedResponse<TaskV2> & {
    error?: string
  }

export type TasksV2GetResponse = WebAPICallResult & {
  error?: string
  task?: TaskV2
}

export type TasksV2CancelResponse = WebAPICallResult & {
  error?: string
  taskStatus?: TaskV2['status']
}

export type TasksV2PublishResponse = WebAPICallResult & {
  error?: string
  creation?: CreationV2
}

// Types

export type TaskV2Args = {
  // creations
  prompt?: string
  negative_prompt?: string
  width?: number
  height?: number
  seed?: number
  lora?: string | null
  lora_strength?: number
  // models
  name?: string
  lora_training_urls?: string[]
  sd_model_version?: string
  concept_mode?: string
  max_train_steps?: number
  resolution?: number
}

export type TaskV2 = {
  _id: string
  user: string
  workflow: string
  model?: string
  name?: string
  args: TaskV2Args
  status: TaskV2Status
  error: string | null
  result: TaskV2Result[]
  createdAt: Date
  updatedAt: Date
}

export interface TaskV2Attributes {
  discordId?: string
  delegateUserId?: string
}
