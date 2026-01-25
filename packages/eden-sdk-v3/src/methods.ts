import type { components } from './generated/sessions-v3'
import { createSessionsV3Client } from './index'
import type { ClientOptions } from 'openapi-fetch'

export type SessionPromptRequest = components['schemas']['SessionPromptRequest']
export type SessionPromptResponse =
  components['schemas']['SessionPromptResponse']
export type SessionStreamEvent = components['schemas']['SessionStreamEvent']

export type SessionsV3ApiOptions = {
  baseUrl: string
  token?: string
  headers?: Record<string, string>
  getHeaders?: () => Record<string, string>
} & Omit<ClientOptions, 'baseUrl' | 'headers'>

export const createSessionsV3Api = (options: SessionsV3ApiOptions) => {
  const baseUrl = options.baseUrl
  const makeHeaders = () => {
    const dynamic = options.getHeaders?.() ?? {}
    const staticHeaders = options.headers ?? {}
    const authHeader = options.token
      ? { Authorization: `Bearer ${options.token}` }
      : {}
    return {
      ...staticHeaders,
      ...authHeader,
      ...dynamic,
    }
  }

  const client = createSessionsV3Client({
    baseUrl,
    ...options,
    headers: makeHeaders(),
  })

  return {
    prompt: async (body: SessionPromptRequest) => {
      const { data, error } = await client.POST('/v3/sessions/prompt', {
        body,
      })
      if (error) {
        throw error
      }
      return data as SessionPromptResponse
    },
    promptStream: async (body: SessionPromptRequest) => {
      const response = await fetch(`${baseUrl}/v3/sessions/prompt/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...makeHeaders(),
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to start session stream')
      }
      return response
    },
  }
}
