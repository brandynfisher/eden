import { WebAPICallResult } from '../EdenClient'

export type AgentsCreateResponse = WebAPICallResult & {
  error?: string
  agentId?: string
}
