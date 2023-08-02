import { PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'

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

export type SessionEventsListResponse = WebAPICallResult &
  PaginatedResponse<SessionEvent> & {
    error?: string
  }

export enum SessionEventType {
  CREATE = 'create',
  END = 'end',
  USER_ADD = 'user_add',
  USER_REMOVE = 'user_remove',
  CHARACTER_ADD = 'character_add',
  CHARACTER_REMOVE = 'character_remove',
  USER_MESSAGE = 'user_message',
  CHARACTER_MESSAGE = 'character_message',
  CREATION_REQUEST = 'creation_request',
  CREATION_RETURN = 'creation_return',
}

export type Session = {
  id: string
  scenario: string
  creator: string
}

export type SessionEvent = {
  id: string
  session: string
  type: SessionEventType
  data: {
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
    userMessage?: {
      user: string
      message: string
      completion: string
    }
    characterMessage?: {
      character: string
      message: string
      completion: string
    }
    creationRequest?: {
      user: string
      character: string
      task: string
    }
    creationReturn?: {
      user: string
      character: string
      creation: string
    }
  }
}
