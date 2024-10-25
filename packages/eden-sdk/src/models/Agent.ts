import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'
import { WebAPICallOptions, WebAPICallResult } from 'src/types'

// Types
export type Agent = {
  _id: string
  user: Creator
  name: string
  key: string
  description?: string
  image?: string
  instructions?: string
  tools?: string[]
  discordId?: string
  createdAt: Date
  updatedAt: Date
  public?: boolean
}

// Arguments
export interface AgentGetArguments extends WebAPICallOptions {
  agentId: string
}

export interface AgentsCreateArguments extends WebAPICallOptions {
  name: string
  key: string
  description?: string
  image?: string
  instructions?: string
  tools?: string[]
  discordId?: string
}

// Requests
export const agentGetRequestConfig = (
  args: AgentGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `agents/${args.agentId}`,
  }
}

export const agentsCreateRequestConfig = (
  args: AgentsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'agents',
    data: args,
  }
}

// Responses
export type AgentGetResponse = WebAPICallResult & {
  agent: Agent
  error?: string
}

export type AgentsCreateResponse = WebAPICallResult & {
  agentId: string
  error?: string
}
