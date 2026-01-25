'use client'

import { env } from '@/lib/config'
import { useAuth } from '@clerk/nextjs'
import { createSessionsV3Api } from '@edenlabs/eden-sdk-v3'
import { useCallback, useRef } from 'react'

interface StreamMessage {
  event: 'session_created' | 'update' | 'done' | 'error' | 'heartbeat'
  data: {
    type?: string
    text?: string
    content?: string
    tool?: string
    result?: unknown
    error?: string
    agent?: {
      _id: string
      username: string
      name: string
      userImage?: string
    }
    session_id?: string
    session_run_id?: string
  }
}

interface UseSessionStreamProps {
  sessionId?: string
  onToken?: (
    text: string,
    meta?: {
      agent?: {
        _id: string
        username: string
        name: string
        userImage?: string
      }
      sessionRunId?: string
    },
  ) => void
  onMessage?: (
    content: string,
    meta?: {
      agent?: {
        _id: string
        username: string
        name: string
        userImage?: string
      }
      sessionRunId?: string
      messageId?: string
    },
  ) => void
  onToolComplete?: (tool: string, result: unknown) => void
  onError?: (error: string) => void
  onDone?: () => void
  onAgentInfo?: (
    agent: {
      _id: string
      username: string
      name: string
      userImage?: string
    },
    sessionRunId?: string,
  ) => void
  onSessionCreated?: (sessionId: string) => void
}

const createApi = (token: string) =>
  createSessionsV3Api({
    baseUrl: env.NEXT_PUBLIC_EDEN_API_URL,
    token,
  })

export const useSessionStream = ({
  sessionId,
  onToken,
  onMessage,
  onToolComplete,
  onError,
  onDone,
  onAgentInfo,
  onSessionCreated,
}: UseSessionStreamProps) => {
  const eventSourceRef = useRef<EventSource | null>(null)
  const { getToken } = useAuth()

  const sendMessage = useCallback(
    async (
      content: string,
      attachments?: string[],
      creationArgs?: {
        agent_ids: string[]
        thinking?: boolean
        session_run_id?: string
        context?: string
        budget?: {
          manna_budget?: number
          token_budget?: number
          turn_budget?: number
        }
        title?: string
        type?: 'normal' | 'natural' | 'automatic'
        settings?: {
          conductor_prompt?: string
          delay_interval: number
          mention_force_reply: boolean
        }
        extras?: {
          incognito?: boolean
          is_public?: boolean
        }
      },
    ) => {
      // Close any existing stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      try {
        let response: Response

        const token = await getToken()
        if (!token) {
          throw new Error('Not authenticated')
        }

        response = await createApi(token).promptStream({
          session_run_id: creationArgs?.session_run_id,
          session_id: sessionId,
          actor_agent_ids: creationArgs?.agent_ids,
          thinking: creationArgs?.thinking,
          creation:
            !sessionId && creationArgs?.agent_ids
              ? { agent_ids: creationArgs.agent_ids }
              : undefined,
          message: {
            content,
            attachments: attachments ?? [],
          },
        })

        if (!response.ok) {
          console.error('Failed to start stream', response)
          throw new Error('Failed to start stream')
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let sessionIdReceived = false

        const processStream = async () => {
          try {
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { done, value } = await reader.read()

              if (done) {
                onDone?.()
                break
              }

              const chunkText = decoder.decode(value, { stream: true })
              buffer += chunkText

              const lines = buffer.split('\n')
              buffer = lines.pop() || ''

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const payload = line.slice(6).trim()
                    if (!payload || payload === '[DONE]') {
                      continue
                    }
                    const data = JSON.parse(payload) as StreamMessage

                    if (data.event === 'update') {
                      if (
                        data.data.type === 'assistant_token' &&
                        data.data.text
                      ) {
                        onToken?.(data.data.text, {
                          agent: data.data.agent,
                          sessionRunId: data.data.session_run_id,
                        })
                      } else if (data.data.type === 'assistant_message') {
                        const messageInfo = (
                          data.data as {
                            message?: { _id?: string; id?: string }
                          }
                        ).message
                        onMessage?.(data.data.content || '', {
                          agent: data.data.agent,
                          sessionRunId: data.data.session_run_id,
                          messageId: messageInfo?._id ?? messageInfo?.id,
                        })
                      } else if (
                        data.data.type === 'tool_complete' &&
                        data.data.tool
                      ) {
                        onToolComplete?.(data.data.tool, data.data.result)
                      } else if (data.data.type === 'error') {
                        onError?.(data.data.error || 'Unknown error')
                      } else if (
                        data.data.type === 'start_prompt' &&
                        data.data.agent
                      ) {
                        onAgentInfo?.(data.data.agent, data.data.session_run_id)
                        if (
                          !sessionIdReceived &&
                          !sessionId &&
                          data.data.session_id
                        ) {
                          sessionIdReceived = true
                          onSessionCreated?.(data.data.session_id)
                        }
                      }
                    } else if (data.event === 'done') {
                      onDone?.()
                      break
                    } else if (data.event === 'session_created') {
                      if (!sessionIdReceived && data.data.session_id) {
                        sessionIdReceived = true
                        onSessionCreated?.(data.data.session_id)
                      }
                    } else if (data.event === 'error') {
                      onError?.(data.data.error || 'Stream error')
                      break
                    }
                  } catch {
                    // ignore parse errors
                  }
                }
              }
            }
          } catch (error) {
            console.error('Stream processing error:', error)
            onError?.('Stream processing failed')
          } finally {
            reader.releaseLock()
          }
        }

        processStream()
      } catch (error) {
        console.error('Failed to send streaming message:', error)
        onError?.('Failed to send message')
      }
    },
    [
      sessionId,
      onToken,
      onMessage,
      onToolComplete,
      onError,
      onDone,
      onAgentInfo,
      onSessionCreated,
      getToken,
    ],
  )

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  return {
    sendMessage,
    stopStream,
  }
}
