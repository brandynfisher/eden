import type { paths } from './generated/sessions-v3'
import createClient, { type ClientOptions } from 'openapi-fetch'

export type { components, paths } from './generated/sessions-v3'
export type SessionsV3Client = ReturnType<typeof createClient<paths>>
export type {
  SessionPromptRequest,
  SessionPromptResponse,
  SessionStreamEvent,
  SessionsV3ApiOptions,
} from './methods'

export const createSessionsV3Client = (options: ClientOptions = {}) =>
  createClient<paths>(options)

export { createSessionsV3Api } from './methods'
