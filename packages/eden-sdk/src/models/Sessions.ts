import { AxiosRequestConfig } from 'axios'
import { ScenarioType } from 'src/models/Scenarios'

import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../EdenClient'
import { transformArgsIntoURLParams } from '../methods'

// Arguments

export interface SessionsCreateArguments extends WebAPICallOptions {
  type: ScenarioType
}

export interface SessionsUpdateArguments extends WebAPICallOptions {
  sessionId: string
  data?: any
}

export interface SessionsDeleteArguments extends WebAPICallOptions {
  sessionId: string
}

export interface SessionsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface SessionsGetArguments extends WebAPICallOptions {
  sessionId: string
}

export interface SessionEventsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  sessionId: string
}

export interface SessionsInteractArguments extends WebAPICallOptions {
  sessionId: string
  userId: string
  interaction: InteractionEvent
}

// Requests

export const sessionsCreateRequestConfig = (
  args: SessionsCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'sessions/create',
    data: {
      ...args,
    },
  }
}

export const sessionsUpdateRequestConfig = (
  args: SessionsUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'sessions/update',
    data: {
      ...args,
    },
  }
}

export const sessionsDeleteRequestConfig = (
  args: SessionsDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'sessions/delete',
    data: {
      ...args,
    },
  }
}

export const sessionsListRequestConfig = (
  args: SessionsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'sessions',
    params,
  }
}

export const sessionsGetRequestConfig = (
  args: SessionsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `sessions/${args.sessionId}`,
  }
}

export const sessionsInteractRequestConfig = (
  args: SessionsInteractArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'sessions/interact',
    data: {
      ...args,
    },
  }
}

export const sessionEventsListRequestConfig = (
  args: SessionEventsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: `sessions/${args.sessionId}/events`,
    params,
  }
}

// Responses

export type SessionsCreateResponse = WebAPICallResult & {
  error?: string
  scenarioId?: string
}

export type SessionsUpdateResponse = WebAPICallResult & {
  eventId: string
  error?: string
}

export type SessionsDeleteResponse = WebAPICallResult & {
  error?: string
}

export type SessionsListResponse = WebAPICallResult &
  PaginatedResponse<Session> & {
    error?: string
  }

export type SessionsGetResponse = WebAPICallResult & {
  error?: string
  scenario: Session
}

export type SessionsInteractResponse = WebAPICallResult & {
  error?: string
  type?: string
  data?: {
    message?: string
    creations?: {
      uri: string
    }[]
  }
}

export type SessionEventsListResponse = WebAPICallResult &
  PaginatedResponse<SessionEvent> & {
    error?: string
  }

// Types

export enum SessionEventType {
  END_SESSION = 'end_session',
  USER_ADD = 'user_add',
  CHARACTER_ADD = 'character_add',
  INTERACTION = 'interaction',
  CHAT_RESPONSE = 'chat_response',
  CREATION_RESPONSE = 'creation_response',
  ERROR_RESPONSE = 'error_response',
}

export type SessionEventResponseType =
  | SessionEventType.CHAT_RESPONSE
  | SessionEventType.CREATION_RESPONSE
  | SessionEventType.ERROR_RESPONSE

export type Session = {
  id: string
  user: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ChatMessage {
  sender: string
  message: string
}

export interface InteractionEvent {
  message: string
  context?: ChatMessage[]
  addressedCharacters?: string[]
}

export interface ChatResponseEvent {
  interaction: string
  message: string
}

export interface CreationResponseEvent {
  interaction: string
  task: string
  creations?: {
    id: string
    uri: string
  }[]
  message?: string
}

export interface ErrorResponseEvent {
  interaction: string
  message: string
  task?: string
}

export type SessionEvent = {
  id?: string
  session?: string
  type?: SessionEventType
  data?: {
    userAdded?: {
      user: string
    }
    userRemoved?: {
      user: string
    }
    characterAdded?: {
      character: string
    }
    characterRemoved?: {
      character: string
    }
    chatRequest?: {
      user: string
      message: string
    }
    chatResponse?: {
      character: string
      message: string
      completion: string
    }
    creationRequest?: {
      user: string
      character: string
      task: string
    }
    creationResponse?: {
      user: string
      character: string
      creation: string
    }
  }
}
