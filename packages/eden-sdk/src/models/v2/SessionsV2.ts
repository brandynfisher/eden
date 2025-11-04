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
  scenario?: string
  budget?: {
    manna_budget?: number
    token_budget?: number
    turn_budget?: number
  }
  title?: string
  autonomy_settings?: {
    auto_reply: boolean
    reply_interval: number
    actor_selection_method: 'random' | 'random_exclude_last'
  }
  extras?: SessionExtras
}

export interface SessionsV2MessageArguments extends WebAPICallOptions {
  session_id?: string // If not provided, will create a new session
  content: string
  attachments?: string[]
  // Creation args (used when session_id is not provided)
  agent_ids?: string[]
  scenario?: string
  budget?: {
    manna_budget?: number
    token_budget?: number
    turn_budget?: number
  }
  title?: string
  autonomy_settings?: {
    auto_reply: boolean
    reply_interval: number
    actor_selection_method: 'random' | 'random_exclude_last'
  }
  extras?: SessionExtras
}

export interface SessionsV2MessageReactArguments extends WebAPICallOptions {
  message_id: string
  reaction: 'thumbs_up' | 'thumbs_down' | 'pin'
}

export interface SessionsV2ListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  user_id?: string
  agent_id?: string
}

export interface SessionsV2GetArguments extends WebAPICallOptions {
  session_id: string
  cursor?: string
  limit?: number
}

export interface SessionsV2DeleteArguments extends WebAPICallOptions {
  session_id: string
}

export interface SessionsV2RenameArguments extends WebAPICallOptions {
  session_id: string
  title?: string
  pinned?: boolean
  extras?: SessionExtras
}

export interface SessionsV2CancelArguments extends WebAPICallOptions {
  session_id: string
  tool_call_id?: string
  tool_call_index?: number
}

export interface SessionsV2ShareCreateArguments extends WebAPICallOptions {
  session_id: string
  message_id: string
  title?: string
}

export interface SessionsV2ShareGetArguments extends WebAPICallOptions {
  share_id: string
}

export interface SessionsV2ShareDeleteArguments extends WebAPICallOptions {
  share_id: string
}

export interface SessionsV2ShareListArguments extends WebAPICallOptions {}

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
  const data: any = {}
  if (args.title !== undefined) {
    data.title = args.title
  }
  if (args.pinned !== undefined) {
    data.pinned = args.pinned
  }
  if (args.extras !== undefined) {
    data.extras = args.extras
  }
  return {
    method: 'PATCH',
    url: `v2/sessions/${args.session_id}`,
    data,
  }
}

export const sessionsCancelRequestConfigV2 = (
  args: SessionsV2CancelArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/sessions/${args.session_id}/cancel`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      ...(args.tool_call_id && { tool_call_id: args.tool_call_id }),
      ...(args.tool_call_index !== undefined && {
        tool_call_index: args.tool_call_index,
      }),
    },
  }
}

export const sessionsShareCreateRequestConfigV2 = (
  args: SessionsV2ShareCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/sessions/${args.session_id}/share`,
    data: {
      message_id: args.message_id,
      ...(args.title && { title: args.title }),
    },
  }
}

export const sessionsShareGetRequestConfigV2 = (
  args: SessionsV2ShareGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/sessions/share/${args.share_id}`,
  }
}

export const sessionsShareDeleteRequestConfigV2 = (
  args: SessionsV2ShareDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/sessions/share/${args.share_id}`,
  }
}

export const sessionsShareListRequestConfigV2 = (
  args: SessionsV2ShareListArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'v2/sessions/shares',
    params: args,
  }
}

export const sessionsGetPermissionsRequestConfigV2 = (
  args: SessionsV2GetPermissionsArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/sessions/${args.session_id}/permissions`,
  }
}

export const sessionsUpdatePermissionsRequestConfigV2 = (
  args: SessionsV2UpdatePermissionsArguments,
): AxiosRequestConfig => {
  return {
    method: 'PUT',
    url: `v2/sessions/${args.session_id}/permissions`,
    data: {
      permissions: args.permissions,
    },
  }
}

export const sessionsGetSharedRequestConfigV2 = (): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'v2/sessions/shared',
  }
}

export const sessionsGetMessagesRequestConfigV2 = (
  args: SessionsV2GetMessagesArguments,
): AxiosRequestConfig => {
  const params: any = {}
  if (args.cursor) {
    params.cursor = args.cursor
  }
  if (args.limit) {
    params.limit = args.limit.toString()
  }
  return {
    method: 'GET',
    url: `v2/sessions/${args.session_id}/messages`,
    params,
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
    | {
        session_id: SessionV2['_id']
        message_id?: string
        success: boolean
      }
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
  nextCursor?: string
  hasMore?: boolean
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

export type SessionsV2CancelResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | {
        status: string
        session_id: string
      }
  )

export type SessionsV2ShareCreateResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | {
        success: boolean
        share_id: string
        share_url: string
      }
  )

export type SessionsV2ShareGetResponse = WebAPICallResult & {
  error?: string
  share?: {
    share_id: string
    title?: string
    session: SessionV2
    messages: Message[]
    owner: Creator
    createdAt: Date
  }
}

export type SessionsV2ShareDeleteResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | { success: boolean }
  )

export interface SessionShare {
  _id: string
  session: {
    _id: string
    title?: string
    scenario?: string
    createdAt: Date
  }
  title?: string
  message_id: string
  createdAt: Date
}

export type SessionsV2ShareListResponse = WebAPICallResult & {
  shares: SessionShare[]
  error?: string
}

export enum SessionPermissionLevel {
  Editor = 'editor',
  Owner = 'owner',
}

export interface SessionPermission {
  _id: string
  session: string
  user: {
    _id: string
    userId?: string
    username: string
    userImage?: string
  }
  level: SessionPermissionLevel
  grantedAt: Date
}

export interface SessionsV2GetPermissionsArguments extends WebAPICallOptions {
  session_id: string
}

export interface SessionsV2UpdatePermissionsArguments
  extends WebAPICallOptions {
  session_id: string
  permissions: Array<{
    username: string
    level: 'editor' | 'owner'
  }>
}

export interface SessionsV2GetSharedArguments extends WebAPICallOptions {}

export interface SessionsV2GetMessagesArguments extends WebAPICallOptions {
  session_id: string
  cursor?: string
  limit?: number
}

export type SessionsV2GetPermissionsResponse = WebAPICallResult & {
  permissions: SessionPermission[]
  error?: string
}

export type SessionsV2UpdatePermissionsResponse = WebAPICallResult & {
  success: boolean
  error?: string
}

export type SessionsV2GetSharedResponse = WebAPICallResult & {
  sharedSessions: Array<{
    session: SessionV2
    permissionLevel: string
    grantedAt: Date
  }>
  error?: string
}

export type SessionsV2GetMessagesResponse = WebAPICallResult & {
  messages: Message[]
  hasMore: boolean
  nextCursor?: string
  error?: string
}

export type SessionStatus = 'active' | 'archived'

export type SessionExtras = {
  exclude_memory?: boolean
  is_public?: boolean
}

export type SessionV2 = {
  _id: string
  owner: Creator
  users?: Creator[]
  session_key?: string
  channel?: string
  parent_session?: string
  agents: Agent[]
  status: SessionStatus
  messages: Message[]
  permissions?: SessionPermission[]
  context?: {
    memories?: string[]
    memory_updated?: string
  }
  title?: string
  scenario?: string
  autonomy_settings?: {
    auto_reply: boolean
    reply_interval: number
    actor_selection_method: 'random' | 'random_exclude_last'
  }
  last_actor_id?: string
  last_memory_message_id?: string
  budget?: {
    token_budget?: number
    manna_budget?: number
    turn_budget?: number
    tokens_spent?: number
    manna_spent?: number
    turns_spent?: number
  }
  platform?: 'discord' | 'telegram' | 'twitter' | 'farcaster'
  trigger?: string
  pinned?: boolean
  active_requests?: string[]
  extras?: SessionExtras
  deleted?: boolean
  createdAt: Date
  updatedAt: Date
}
