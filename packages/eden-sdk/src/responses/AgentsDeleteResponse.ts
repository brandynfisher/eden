import { WebAPICallResult } from '../EdenClient'

export type AgentsDeleteResponse = WebAPICallResult & {
  error?: string
}
