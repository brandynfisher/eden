import { Capability } from 'src/responses/CapabilityResponses'
import { PaginatedResponse } from 'src/responses/base'

import { WebAPICallResult } from '../EdenClient'

export type AgentsCreateResponse = WebAPICallResult & {
  error?: string
  agentId?: string
}

export type AgentsUpdateResponse = WebAPICallResult & {
  error?: string
  agentId?: string
}

export type AgentsDeleteResponse = WebAPICallResult & {
  error?: string
}

export type AgentsListResponse = WebAPICallResult &
  PaginatedResponse<Agent> & {
    error?: string
  }

export type AgentsGetResponse = WebAPICallResult & {
  error?: string
  agent: Agent
}

export type Agent = {
  id: string
  name: string
  capabilities: Capability[]
}
