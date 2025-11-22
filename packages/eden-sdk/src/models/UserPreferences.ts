import { WebAPICallResult } from '../types'
import { AxiosRequestConfig } from 'axios'

// Minimal agent data for quick switching
export interface MinimalAgent {
  _id: string
  username?: string
  userImage?: string
  name?: string
  owner?: string | { _id: string; username?: string }
}

export interface UserPreferencesGetResponse extends WebAPICallResult {
  last_agents: MinimalAgent[]
  pinned_agents: MinimalAgent[]
}

export interface UserPreferencesGetArguments {
  populateOwner?: boolean
  [key: string]: unknown
}

export const userPreferencesGetRequestConfig = (
  args: UserPreferencesGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'user-preferences',
    params: {
      ...(args.populateOwner && { populateOwner: 'true' }),
    },
  }
}
