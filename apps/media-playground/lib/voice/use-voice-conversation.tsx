'use client'

import { DEFAULT_AGENT_CONFIG } from './realtime-user-fields-config'
import {
  ConnectionStatus,
  DebugLog,
  TranscriptMessage,
  VoiceConversation,
  VoiceProviderConfig,
} from './types'
// @ts-ignore - Optional dependency
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
  const [inputVolume, setInputVolume] = useState<number>(0)
  const sessionIdRef = useRef<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Helper function to add debug logs
  const addDebugLog = useCallback(
    (message: string, type: DebugLog['type'] = 'info') => {
      const timestamp = new Date().toLocaleTimeString()
      setDebugLogs(prev => [...prev, { timestamp, message, type }])
    },
    [],
  )

  // Helper function to monitor microphone volume
  const startVolumeMonitoring = useCallback(
    (stream: MediaStream) => {
      try {
        // Create audio context and analyser
        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        const source = audioContext.createMediaStreamSource(stream)

        // Smaller fftSize for faster response (128 = very responsive)
        analyser.fftSize = 128
        analyser.smoothingTimeConstant = 0.3 // Reduce smoothing for faster response
        source.connect(analyser)

        audioContextRef.current = audioContext
        analyserRef.current = analyser

        // Function to continuously read volume using time domain data (faster than frequency data)
        const dataArray = new Uint8Array(analyser.fftSize)
        const updateVolume = () => {
          if (analyserRef.current) {
            // Use time domain data for immediate amplitude response
            analyserRef.current.getByteTimeDomainData(dataArray)

            // Calculate RMS (Root Mean Square) for volume
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
              const normalized = (dataArray[i] - 128) / 128 // Normalize to -1 to 1
              sum += normalized * normalized
            }
            const rms = Math.sqrt(sum / dataArray.length)

            // Amplify and normalize to 0-100 range with more sensitivity
            const normalizedVolume = Math.min(100, rms * 300)

            setInputVolume(normalizedVolume)
            animationFrameRef.current = requestAnimationFrame(updateVolume)
          }
        }

        updateVolume()
        addDebugLog('Volume monitoring started', 'success')
      } catch (error) {
        addDebugLog('Failed to start volume monitoring', 'warning')
      }
    },
    [addDebugLog],
  )

  // Helper function to stop volume monitoring
  const stopVolumeMonitoring = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
    setInputVolume(0)
    addDebugLog('Volume monitoring stopped', 'info')
  }, [addDebugLog])

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

  // Build conversation overrides with user context
  // This is the recommended approach per ElevenLabs docs
  const buildConversationOverrides = useCallback(() => {
    // Start with base prompt
    let systemPrompt = config.agentPrompt

    // Filter out empty values from userInfo
    const filledUserInfo = config.userInfo
      ? Object.fromEntries(
          Object.entries(config.userInfo).filter(
            ([, value]) => value.trim() !== '',
          ),
        )
      : {}

    // Add user context if provided
    if (Object.keys(filledUserInfo).length > 0) {
      const userContextParts = Object.entries(filledUserInfo).map(
        ([key, value]) => `${key}: ${value}`,
      )
      systemPrompt += `\n\nUser Information:\n${userContextParts.join(
        '\n',
      )}\n\nUse this information to personalize your responses.`
    }

    // Build first message with precedence:
    // 1. Explicit override from conversationConfig has highest priority
    // 2. Fall back to DEFAULT_AGENT_CONFIG firstMessage
    // 3. Prepend personalized greeting if user name is provided
    let firstMessage =
      config.conversationConfig?.agent?.firstMessage ||
      DEFAULT_AGENT_CONFIG.agent.firstMessage

    // Prepend personalized greeting if user name exists
    const userName = filledUserInfo['name'] || filledUserInfo['Name']
    if (userName && firstMessage) {
      firstMessage = `Heey ${userName}! ${firstMessage}`
    }

    // Merge with base config and user overrides
    const overrides = {
      agent: {
        prompt: {
          prompt: systemPrompt,
          llm:
            config.conversationConfig?.agent?.prompt?.llm ||
            DEFAULT_AGENT_CONFIG.agent.prompt.llm,
          temperature:
            config.conversationConfig?.agent?.prompt?.temperature ||
            DEFAULT_AGENT_CONFIG.agent.prompt.temperature,
          maxTokens:
            config.conversationConfig?.agent?.prompt?.maxTokens ||
            DEFAULT_AGENT_CONFIG.agent.prompt.maxTokens,
        },
        ...(firstMessage && { firstMessage }),
        ...(config.conversationConfig?.agent?.language && {
          language: config.conversationConfig.agent.language,
        }),
      },
    }

    addDebugLog('Built conversation overrides', 'info')
    addDebugLog(`  Prompt: ${systemPrompt.length} chars`, 'debug')
    if (firstMessage) {
      addDebugLog(`  First message: "${firstMessage}"`, 'debug')
    }
    if (Object.keys(filledUserInfo).length > 0) {
      addDebugLog(
        `  User info fields: ${Object.keys(filledUserInfo).join(', ')}`,
        'debug',
      )
    }

    return overrides
  }, [
    config.agentPrompt,
    config.agentName,
    config.userInfo,
    config.conversationConfig,
    addDebugLog,
  ])

  // Initialize ElevenLabs conversation
  // Note: onMessage uses sessionId from the current closure
  const conversation = useConversation({
    apiKey: apiKey || '',
    onConnect: () => {
      addDebugLog('Connected to agent', 'success')
    },
    onDisconnect: (reason: unknown) => {
      addDebugLog(
        `Disconnected from agent. Reason: ${JSON.stringify(reason)}`,
        'warning',
      )
    },
    onMessage: async (message: { source: string; message: string }) => {
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
    onStatusChange: (status: unknown) => {
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      addDebugLog('Microphone access granted', 'success')

      // Start monitoring microphone volume
      startVolumeMonitoring(stream)

      // Create Eden session with user info
      try {
        addDebugLog('Creating Eden session...', 'info')

        // Filter out empty values from userInfo
        const filledUserInfo = config.userInfo
          ? Object.fromEntries(
              Object.entries(config.userInfo).filter(
                ([, value]) => value.trim() !== '',
              ),
            )
          : {}

        const sessionResponse = await fetch('/api/realtime/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: config.edenAgentId,
            userInfo: filledUserInfo,
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

      // Build conversation overrides with user context
      const overrides = buildConversationOverrides()

      // Start the conversation with overrides
      addDebugLog('Starting conversation session with overrides...', 'info')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (conversation.startSession as any)({
        agentId,
        overrides,
      })
      addDebugLog('Session started successfully', 'success')
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Failed to start: ${errorMessage}`, 'error')
    }
  }, [
    apiKey,
    agentId,
    conversation,
    config.edenAgentId,
    buildConversationOverrides,
    addDebugLog,
    startVolumeMonitoring,
  ])

  const endConversation = useCallback(async () => {
    try {
      addDebugLog('Stopping conversation...', 'info')
      await conversation.endSession()
      stopVolumeMonitoring()
      addDebugLog('Conversation stopped', 'success')
      sessionIdRef.current = null
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Error stopping: ${errorMessage}`, 'error')
    }
  }, [conversation, addDebugLog, stopVolumeMonitoring])

  // Map ElevenLabs status to our generic status type
  const status: ConnectionStatus = conversation.status || 'disconnected'

  return {
    status,
    isSpeaking: conversation.isSpeaking || false,
    canSendFeedback: conversation.canSendFeedback || false,
    transcript,
    debugLogs,
    inputVolume,
    startConversation,
    endConversation,
    addDebugLog,
  }
}
