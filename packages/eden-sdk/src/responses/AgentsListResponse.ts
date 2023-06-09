import { WebAPICallResult } from '../EdenClient'
import { PaginatedResponse } from './base'

export type AgentsListResponse = WebAPICallResult &
  PaginatedResponse<Agent> & {
    error?: string
  }

export type Capability = {
  name: string
  type: string
  data: any
}

export type Agent = {
  name: string
  capabilites: Capability[]
}
