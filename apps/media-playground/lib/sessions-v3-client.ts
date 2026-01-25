'use client'

import { env } from '@/lib/config'
import type { components } from '@/types/sessions-v3'
import * as Sentry from '@sentry/nextjs'

export type SessionPromptRequest = components['schemas']['SessionPromptRequest']
export type SessionPromptResponse =
  components['schemas']['SessionPromptResponse']
export type SessionStreamEvent = components['schemas']['SessionStreamEvent']

const getSentryTraceHeaders = () => {
  try {
    const traceData = (
      Sentry as unknown as {
        getTraceData?: () => Record<string, string>
      }
    ).getTraceData?.()
    if (!traceData) return {}
    return traceData
  } catch {
    return {}
  }
}

export const promptSessionV3 = async (options: {
  token: string
  body: SessionPromptRequest
}): Promise<SessionPromptResponse> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_EDEN_API_URL}/v3/sessions/prompt`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.token}`,
        ...getSentryTraceHeaders(),
      },
      body: JSON.stringify(options.body),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to prompt session')
  }

  return (await response.json()) as SessionPromptResponse
}

export const promptSessionV3Stream = async (options: {
  token: string
  body: SessionPromptRequest
}): Promise<Response> => {
  const response = await fetch(
    `${env.NEXT_PUBLIC_EDEN_API_URL}/v3/sessions/prompt/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.token}`,
        ...getSentryTraceHeaders(),
      },
      body: JSON.stringify(options.body),
    },
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to start session stream')
  }

  return response
}
