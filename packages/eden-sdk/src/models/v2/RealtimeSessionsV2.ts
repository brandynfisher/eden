import { WebAPICallOptions, WebAPICallResult } from '../../types'
import { AxiosRequestConfig } from 'axios'

// Types
export type RealtimeSessionStatus = 'active' | 'closed'

export type RealtimeSessionClosedReason =
  | 'user'
  | 'timeout'
  | 'error'
  | 'insufficient_balance'

export type RealtimeSessionV2 = {
  _id: string
  user: string
  agent: string
  session: string
  status: RealtimeSessionStatus
  startedAt: Date
  closedAt?: Date
  lastActivityAt: Date
  totalMinutesBilled: number
  closedReason?: RealtimeSessionClosedReason
  createdAt: Date
  updatedAt: Date
}

// Arguments
export interface RealtimeSessionsV2StartArguments extends WebAPICallOptions {
  agentId: string
  sessionId?: string
}

export interface RealtimeSessionsV2CloseArguments extends WebAPICallOptions {
  realtimeSessionId: string
}

export interface RealtimeSessionsV2HeartbeatArguments
  extends WebAPICallOptions {
  realtimeSessionId: string
}

export interface RealtimeSessionsV2GetArguments extends WebAPICallOptions {
  realtimeSessionId: string
}

// Request Configs
export const realtimeSessionsV2StartRequestConfig = (
  args: RealtimeSessionsV2StartArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/realtime-sessions/start',
    data: {
      agentId: args.agentId,
      ...(args.sessionId && { sessionId: args.sessionId }),
    },
  }
}

export const realtimeSessionsV2CloseRequestConfig = (
  args: RealtimeSessionsV2CloseArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/realtime-sessions/${args.realtimeSessionId}/close`,
    data: {},
    headers: { 'Content-Type': 'application/json' },
  }
}

export const realtimeSessionsV2HeartbeatRequestConfig = (
  args: RealtimeSessionsV2HeartbeatArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/realtime-sessions/${args.realtimeSessionId}/heartbeat`,
    data: {},
    headers: { 'Content-Type': 'application/json' },
  }
}

export const realtimeSessionsV2GetRequestConfig = (
  args: RealtimeSessionsV2GetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/realtime-sessions/${args.realtimeSessionId}`,
  }
}

// Responses
export type RealtimeSessionsV2StartResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | {
        success: boolean
        realtimeSession: RealtimeSessionV2
        billingConfig: {
          costPerMinute: number
          billingIntervalSeconds: number
        }
      }
  )

export type RealtimeSessionsV2CloseResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | {
        success: boolean
        realtimeSession: RealtimeSessionV2
        totalMannaBilled: number
      }
  )

export type RealtimeSessionsV2HeartbeatResponse = WebAPICallResult &
  (
    | {
        error?: string
        message?: string
      }
    | {
        success: boolean
        realtimeSession: RealtimeSessionV2
        billedThisTick: boolean
        totalMinutesBilled: number
      }
  )

export type RealtimeSessionsV2GetResponse = WebAPICallResult & {
  error?: string
  realtimeSession?: RealtimeSessionV2
}
