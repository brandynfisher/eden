'use client'

import { DEFAULT_AGENT_CONFIG, mergeAgentConfig } from './agent-config'
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
  config: VoiceProviderConfig & { edenAgentId: string },
): VoiceConversation {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [isAgentUpdated, setIsAgentUpdated] = useState(false)
  const sessionIdRef = useRef<string | null>(null)
  const isUpdatingRef = useRef(false)

  // Helper function to add debug logs
  const addDebugLog = useCallback(
    (message: string, type: DebugLog['type'] = 'info') => {
      const timestamp = new Date().toLocaleTimeString()
      setDebugLogs(prev => [...prev, { timestamp, message, type }])
    },
    [],
  )

  // Helper function to log messages to Eden session
  const logMessageToSession = useCallback(
    async (sessionId: string, role: 'user' | 'assistant', content: string) => {
      const roleLabel = role === 'assistant' ? 'agent' : 'user'
      addDebugLog(
        `💾 Saving ${roleLabel} message to session ${sessionId}`,
        'info',
      )
      try {
        const response = await fetch('/api/realtime/session/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, role, content }),
        })

        if (response.ok) {
          addDebugLog(`✅ ${roleLabel} message saved to session`, 'success')
        } else {
          const errorText = await response.text()
          addDebugLog(
            `❌ Failed to save ${roleLabel} message: ${response.status} ${errorText}`,
            'error',
          )
        }
      } catch (error) {
        addDebugLog(
          `❌ Error saving ${roleLabel} message: ${
            error instanceof Error ? error.message : String(error)
          }`,
          'error',
        )
      }
    },
    [addDebugLog],
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
      addDebugLog('Checking agent configuration...', 'info')

      const client = new ElevenLabsClient({
        apiKey,
      })

      // Fetch current agent configuration
      const currentAgent = await client.conversationalAi.agents.get(agentId)

      // The API returns conversationConfig (camelCase) not conversation_config (snake_case)
      const currentPromptConfig = currentAgent.conversationConfig?.agent?.prompt

      // Merge default config with user overrides to get desired config
      const baseConfig = {
        ...DEFAULT_AGENT_CONFIG,
        agent: {
          ...DEFAULT_AGENT_CONFIG.agent,
          prompt: {
            ...DEFAULT_AGENT_CONFIG.agent.prompt,
            prompt: config.agentPrompt, // Set the dynamic prompt
          },
        },
      }

      const desiredConfig = mergeAgentConfig(
        baseConfig,
        config.conversationConfig,
      )

      // Compare all relevant config settings
      const differences: string[] = []

      if (currentPromptConfig?.prompt !== desiredConfig.agent.prompt.prompt) {
        const currentLength = currentPromptConfig?.prompt?.length || 0
        const desiredLength = desiredConfig.agent.prompt.prompt.length
        differences.push(
          `prompt (current: ${currentLength} chars, "${currentPromptConfig?.prompt?.substring(
            0,
            50,
          )}..." | desired: ${desiredLength} chars, "${desiredConfig.agent.prompt.prompt.substring(
            0,
            50,
          )}...")`,
        )
      }
      if (currentPromptConfig?.llm !== desiredConfig.agent.prompt.llm) {
        differences.push(
          `llm (current: ${currentPromptConfig?.llm} | desired: ${desiredConfig.agent.prompt.llm})`,
        )
      }
      if (
        currentPromptConfig?.temperature !==
        desiredConfig.agent.prompt.temperature
      ) {
        differences.push(
          `temperature (current: ${currentPromptConfig?.temperature} | desired: ${desiredConfig.agent.prompt.temperature})`,
        )
      }
      if (
        currentPromptConfig?.maxTokens !== desiredConfig.agent.prompt.maxTokens
      ) {
        differences.push(
          `maxTokens (current: ${currentPromptConfig?.maxTokens} | desired: ${desiredConfig.agent.prompt.maxTokens})`,
        )
      }

      const needsUpdate = differences.length > 0

      if (needsUpdate) {
        addDebugLog(
          `Configuration differs in ${differences.length} field(s):`,
          'info',
        )
        differences.forEach(diff => {
          addDebugLog(`  - ${diff}`, 'info')
        })
        addDebugLog('Updating agent...', 'info')

        await client.conversationalAi.agents.update(agentId, {
          conversationConfig: desiredConfig,
        })

        addDebugLog('Agent configuration updated successfully', 'success')
      } else {
        addDebugLog(
          'Agent configuration already up to date, skipping update',
          'success',
        )
      }

      setIsAgentUpdated(true)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Failed to update agent: ${errorMessage}`, 'error')
    } finally {
      isUpdatingRef.current = false
    }
  }, [
    apiKey,
    agentId,
    config.agentPrompt,
    config.conversationConfig,
    isAgentUpdated,
    addDebugLog,
  ])

  // Initialize ElevenLabs conversation
  // Note: onMessage uses sessionId from the current closure
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
    onMessage: async message => {
      // Handle messages from ElevenLabs - messages have source: 'user' or 'ai'
      if (message.source === 'ai') {
        addDebugLog(
          `📨 Agent message received (${message.message.length} chars)`,
          'info',
        )
        setTranscript(prev => [
          ...prev,
          {
            role: 'agent',
            text: message.message,
            timestamp: new Date().toLocaleTimeString(),
            isFinal: true,
          },
        ])

        // Log agent message to Eden session
        const currentSessionId = sessionIdRef.current
        if (currentSessionId) {
          await logMessageToSession(
            currentSessionId,
            'assistant',
            message.message,
          )
        } else {
          addDebugLog('⚠️ No sessionId, skipping agent message save', 'warning')
        }
      } else if (message.source === 'user') {
        addDebugLog(
          `📨 User message received (${message.message.length} chars)`,
          'info',
        )
        setTranscript(prev => [
          ...prev,
          {
            role: 'user',
            text: message.message,
            timestamp: new Date().toLocaleTimeString(),
            isFinal: true,
          },
        ])

        // Log user message to Eden session
        const currentSessionId = sessionIdRef.current
        if (currentSessionId) {
          await logMessageToSession(currentSessionId, 'user', message.message)
        } else {
          addDebugLog('⚠️ No sessionId, skipping user message save', 'warning')
        }
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

      // Create Eden session
      try {
        addDebugLog('Creating Eden session...', 'info')
        const sessionResponse = await fetch('/api/realtime/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: config.edenAgentId,
          }),
        })

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json()
          // SDK returns { success, session: { _id, ... }, message }
          const newSessionId = sessionData.session?._id
          if (newSessionId) {
            sessionIdRef.current = newSessionId
            addDebugLog(`Eden session created: ${newSessionId}`, 'success')
          } else {
            addDebugLog('No session ID in response', 'warning')
          }
        } else {
          const errorText = await sessionResponse.text()
          addDebugLog(
            `Failed to create Eden session: ${sessionResponse.status} ${errorText}`,
            'warning',
          )
        }
      } catch (error) {
        addDebugLog('Error creating Eden session', 'warning')
      }

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
      sessionIdRef.current = null
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
