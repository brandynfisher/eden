import { WebAPICallResult } from '../EdenClient'

export type AgentsGetResponse = WebAPICallResult & {
  error?: string
  agent: Agent
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
