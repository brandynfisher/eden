import { WebAPICallResult } from '../types'
import { AxiosRequestConfig } from 'axios'

// Minimal agent data for quick switching
export interface MinimalAgent {
  _id: string
  username?: string
  userImage?: string
  name?: string
  owner?: string
}

export interface UserPreferencesGetResponse extends WebAPICallResult {
  last_agents: MinimalAgent[]
  pinned_agents: MinimalAgent[]
  hidden_agents: string[]
}

export interface UserPreferencesGetArguments {
  [key: string]: unknown
}

export const userPreferencesGetRequestConfig = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  args: UserPreferencesGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'user-preferences',
  }
}
