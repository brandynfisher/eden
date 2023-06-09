import { PaginatedResponse } from 'src/responses/base'

import { WebAPICallResult } from '../EdenClient'

export type TasksListResponse = WebAPICallResult &
  PaginatedResponse<Task> & {
    error?: string
  }

export type Task = {
  _id: string
  user: string
  generator: string
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
  creation?: string
  lora?: string
}
