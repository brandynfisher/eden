import { WebAPICallResult } from '../EdenClient'

export type AgentsUpdateResponse = WebAPICallResult & {
  error?: string
  agentId?: string
}
