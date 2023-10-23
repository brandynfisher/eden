import { PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'
import { Generator } from './GeneratorsResponses'

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

export type Task = {
  _id: string
  user: string
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
  createdAt: string
  updatedAt: string
}

export type Completion = {
  id: string
  text: string
}
