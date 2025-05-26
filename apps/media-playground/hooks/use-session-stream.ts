'use client'

import { useCallback, useRef } from 'react'

interface StreamMessage {
  event: 'update' | 'done' | 'error'
  data: {
    type?: string
    text?: string
    content?: string
    tool?: string
    result?: any
    error?: string
  }
}

interface UseSessionStreamProps {
  sessionId: string
  onToken?: (text: string) => void
  onMessage?: (content: string) => void
  onToolComplete?: (tool: string, result: any) => void
  onError?: (error: string) => void
  onDone?: () => void
}

export const useSessionStream = ({
  sessionId,
  onToken,
  onMessage,
  onToolComplete,
  onError,
  onDone,
}: UseSessionStreamProps) => {
  const eventSourceRef = useRef<EventSource | null>(null)

  const sendMessage = useCallback(
    async (content: string, attachments?: string[]) => {
      // Close any existing stream
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      try {
        // Start the stream by posting to the streaming endpoint
        const response = await fetch(
          `/api/sessions/${sessionId}/messages/stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content,
              attachments,
            }),
          },
        )

        if (!response.ok) {
          throw new Error('Failed to start stream')
        }

        // Create EventSource from the response
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let buffer = ''

        const processStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()

              if (done) {
                onDone?.()
                break
              }

              buffer += decoder.decode(value, { stream: true })

              // Process complete messages
              const lines = buffer.split('\n')
              buffer = lines.pop() || '' // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6)) as StreamMessage
                    console.log('***debug data', data)

                    if (data.event === 'update') {
                      if (
                        data.data.type === 'assistant_token' &&
                        data.data.text
                      ) {
                        onToken?.(data.data.text)
                      } else if (
                        data.data.type === 'assistant_message' &&
                        data.data.content
                      ) {
                        onMessage?.(data.data.content)
                      } else if (
                        data.data.type === 'tool_complete' &&
                        data.data.tool
                      ) {
                        onToolComplete?.(data.data.tool, data.data.result)
                      } else if (data.data.type === 'error') {
                        onError?.(data.data.error || 'Unknown error')
                      }
                    } else if (data.event === 'done') {
                      onDone?.()
                      break
                    } else if (data.event === 'error') {
                      onError?.(data.data.error || 'Stream error')
                      break
                    }
                  } catch (e) {
                    console.error('Failed to parse SSE message:', e)
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
    [sessionId, onToken, onMessage, onToolComplete, onError, onDone],
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
