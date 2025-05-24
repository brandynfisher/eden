import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { Creator } from '../Creators'
import { Agent } from './Agents'
import { Message } from './Messages'
import { AxiosRequestConfig } from 'axios'

// Arguments
export interface SessionsV2CreateArguments extends WebAPICallOptions {
  agent_ids: string[]
  scenario: string
  budget: number
}

export interface SessionsV2MessageArguments extends WebAPICallOptions {
  session_id?: string
  content: string
  attachments?: string[]
}

export interface SessionsV2PinMessageArguments extends WebAPICallOptions {
  message_id: string
}

export interface SessionsV2UnpinMessageArguments extends WebAPICallOptions {
  message_id: string
}

export interface SessionsV2MessageReactArguments extends WebAPICallOptions {
  message_id: string
  reaction: 'thumbs_up' | 'thumbs_down' | 'pin'
}

export interface SessionsV2ListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  agent_id?: string
}

export interface SessionsV2GetArguments extends WebAPICallOptions {
  session_id: string
}

export interface SessionsV2DeleteArguments extends WebAPICallOptions {
  session_id: string
}

export interface SessionsV2RenameArguments extends WebAPICallOptions {
  session_id: string
  title: string
}

// Requests
export const sessionsCreateRequestConfigV2 = (
  args: SessionsV2CreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/sessions/create',
    data: {
      ...args,
    },
  }
}

export const sessionsMessageRequestConfigV2 = (
  args: SessionsV2MessageArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/sessions',
    data: {
      ...args,
    },
  }
}

export const sessionsMessageReactRequestConfigV2 = (
  args: SessionsV2MessageReactArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/sessions/react',
    data: {
      ...args,
    },
  }
}

export const sessionsPinMessageRequestConfigV2 = (
  args: SessionsV2PinMessageArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/sessions/pin',
    data: {
      ...args,
    },
  }
}

export const sessionsUnpinMessageRequestConfigV2 = (
  args: SessionsV2UnpinMessageArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/sessions/unpin',
    data: {
      ...args,
    },
  }
}

export const sessionsListRequestConfigV2 = (
  args: SessionsV2ListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/sessions',
    params,
  }
}

export const sessionsGetRequestConfigV2 = (
  args: SessionsV2GetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/sessions/${args.session_id}`,
  }
}

export const sessionsDeleteRequestConfigV2 = (
  args: SessionsV2DeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/sessions/${args.session_id}`,
  }
}

export const sessionsRenameRequestConfigV2 = (
  args: SessionsV2RenameArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v2/sessions/${args.session_id}`,
    data: {
      title: args.title,
    },
  }
}

// Responses
export type SessionsV2CreateResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | {
        session: SessionV2
        success: boolean
      }
  )

export type SessionsV2MessageResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { session_id?: SessionV2['_id']; success: boolean }
  )

export type SessionsV2PinMessageResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { success: boolean }
  )

export type SessionsV2UnpinMessageResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { success: boolean }
  )

export type SessionsV2MessageReactResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { success: boolean; message?: Message }
  )

export type SessionsV2ListResponse = WebAPICallResult &
  PaginatedResponse<SessionV2> & {
    error?: string
  }

export type SessionsV2GetResponse = WebAPICallResult & {
  error?: string
  session?: SessionV2
}

export type SessionsV2DeleteResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { success: boolean }
  )

export type SessionsV2RenameResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { success: boolean }
  )

export type SessionV2 = {
  _id: string
  owner: Creator
  agents: Agent[]
  channel?: string
  title?: string
  scenario?: string
  messages: Message[]
  budget?: number
  spent?: number
  createdAt: Date
  updatedAt: Date
}
