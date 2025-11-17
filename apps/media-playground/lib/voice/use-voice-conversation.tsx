'use client'

import {
  ConnectionStatus,
  DebugLog,
  TranscriptMessage,
  VoiceConversation,
  VoiceProviderConfig,
} from './types'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { useConversation } from '@elevenlabs/react'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook for managing voice conversations with abstracted provider support
 * Currently supports ElevenLabs, designed to be extended for other providers
 */
export function useVoiceConversation(
  config: VoiceProviderConfig,
): VoiceConversation {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [isAgentUpdated, setIsAgentUpdated] = useState(false)
  const isUpdatingRef = useRef(false)

  // Helper function to add debug logs
  const addDebugLog = useCallback(
    (message: string, type: DebugLog['type'] = 'info') => {
      const timestamp = new Date().toLocaleTimeString()
      setDebugLogs(prev => [...prev, { timestamp, message, type }])
    },
    [],
  )

  // Fetch configuration on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/realtime/config')
        if (!response.ok) {
          throw new Error('Failed to fetch configuration')
        }
        const data = await response.json()
        setApiKey(data.apiKey)
        setAgentId(data.agentId)
        addDebugLog('Configuration loaded successfully', 'success')
      } catch (error) {
        console.error('Error fetching configuration:', error)
        addDebugLog('Failed to fetch ElevenLabs configuration', 'error')
      }
    }

    fetchConfig()
  }, [addDebugLog])

  // Update agent with custom prompt and settings
  const updateAgent = useCallback(async () => {
    if (!apiKey || !agentId || isUpdatingRef.current || isAgentUpdated) return

    isUpdatingRef.current = true

    try {
      addDebugLog('Updating agent configuration...', 'info')

      const client = new ElevenLabsClient({
        apiKey,
      })

      await client.conversationalAi.agents.update(agentId, {
        conversationConfig: {
          agent: {
            prompt: {
              prompt: config.agentPrompt,
              llm: 'gpt-4o',
              temperature: config.temperature || 0.75,
              maxTokens: 10000,
            },
          },
        },
      })

      addDebugLog('Agent configuration updated successfully', 'success')
      setIsAgentUpdated(true)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Failed to update agent: ${errorMessage}`, 'error')
      console.error('Error updating agent:', error)
    } finally {
      isUpdatingRef.current = false
    }
  }, [
    apiKey,
    agentId,
    config.agentPrompt,
    config.temperature,
    isAgentUpdated,
    addDebugLog,
  ])

  // Initialize ElevenLabs conversation
  const conversation = useConversation({
    apiKey: apiKey || '',
    onConnect: () => {
      addDebugLog('Connected to agent', 'success')
    },
    onDisconnect: reason => {
      addDebugLog(
        `Disconnected from agent. Reason: ${JSON.stringify(reason)}`,
        'warning',
      )
    },
    onMessage: message => {
      // Handle messages from ElevenLabs - messages have source: 'user' or 'ai'
      if (message.source === 'ai') {
        setTranscript(prev => [
          ...prev,
          {
            role: 'agent',
            text: message.message,
            timestamp: new Date().toLocaleTimeString(),
            isFinal: true,
          },
        ])
      } else if (message.source === 'user') {
        setTranscript(prev => [
          ...prev,
          {
            role: 'user',
            text: message.message,
            timestamp: new Date().toLocaleTimeString(),
            isFinal: true,
          },
        ])
      }
    },
    onError: (error: unknown) => {
      const errorMessage =
        typeof error === 'string'
          ? error
          : error instanceof Error
          ? error.message
          : JSON.stringify(error)
      addDebugLog(`Error: ${errorMessage}`, 'error')
    },
    onStatusChange: status => {
      addDebugLog(`Status changed to: ${JSON.stringify(status)}`, 'info')
    },
  })

  const startConversation = useCallback(async () => {
    if (!apiKey || !agentId) {
      addDebugLog('Configuration not ready yet', 'error')
      return
    }

    try {
      addDebugLog('Requesting microphone access...', 'info')

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      addDebugLog('Microphone access granted', 'success')

      // Update agent configuration before starting
      await updateAgent()

      // Start the conversation
      addDebugLog('Starting conversation session...', 'info')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (conversation.startSession as any)({
        agentId,
      })
      addDebugLog('Session started successfully', 'success')
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Failed to start: ${errorMessage}`, 'error')
    }
  }, [apiKey, agentId, conversation, updateAgent, addDebugLog])

  const endConversation = useCallback(async () => {
    try {
      addDebugLog('Stopping conversation...', 'info')
      await conversation.endSession()
      addDebugLog('Conversation stopped', 'success')
      // Reset agent updated flag for next session
      setIsAgentUpdated(false)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Error stopping: ${errorMessage}`, 'error')
    }
  }, [conversation, addDebugLog])

  // Map ElevenLabs status to our generic status type
  const status: ConnectionStatus = conversation.status || 'disconnected'

  return {
    status,
    isSpeaking: conversation.isSpeaking || false,
    canSendFeedback: conversation.canSendFeedback || false,
    transcript,
    debugLogs,
    startConversation,
    endConversation,
    addDebugLog,
  }
}
