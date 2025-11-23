'use client'

import { SAFE_MICROPHONE_CONSTRAINTS } from './audio-config'
import { validateDynamicVariables } from './build-dynamic-variables'
import {
  ConnectionStatus,
  DebugLog,
  TranscriptMessage,
  VoiceConversation,
  VoiceProviderConfig,
} from './types'
// @ts-ignore - Optional dependency
import { useConversation } from '@elevenlabs/react'
import { useCallback, useRef, useState } from 'react'

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
  }, [])

  // Helper function to log messages to Eden session
  const logMessageToSession = useCallback(
    async (sessionId: string, role: 'user' | 'assistant', content: string) => {
      try {
        const response = await fetch('/api/realtime/session/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, role, content }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          addDebugLog(
            `Failed to save message: ${response.status} ${errorText}`,
            'error',
          )
        }
      } catch (error) {
        addDebugLog(
          `Error saving message: ${
            error instanceof Error ? error.message : String(error)
          }`,
          'error',
        )
      }
    },
    [addDebugLog],
  )

  // Helper function to fetch configuration
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/realtime/config')
      if (!response.ok) {
        throw new Error('Failed to fetch configuration')
      }
      const data = await response.json()
      setApiKey(data.apiKey)
      setAgentId(data.agentId)
      addDebugLog('Configuration loaded successfully', 'success')
      return { apiKey: data.apiKey, agentId: data.agentId }
    } catch (error) {
      addDebugLog('Failed to fetch ElevenLabs configuration', 'error')
      return null
    }
  }, [addDebugLog])

  // Prepare conversation config with dynamic variables
  // This uses ElevenLabs' recommended dynamic variables approach
  const prepareConversationConfig = useCallback(() => {
    // Validate dynamic variables
    const validation = validateDynamicVariables(config.dynamicVariables)

    if (!validation.valid) {
      addDebugLog(
        'Invalid dynamic variables: ' + validation.errors.join(', '),
        'error',
      )
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        addDebugLog(warning, 'warning')
      })
    }

    // Return config for ElevenLabs startSession
    // We only pass dynamic variables now (agent_system_prompt and first_message)
    const sessionConfig = {
      dynamicVariables: config.dynamicVariables,
      // Optional config overrides for non-prompt settings only
      ...(config.conversationConfig?.agent?.language && {
        overrides: {
          agent: {
            language: config.conversationConfig.agent.language,
            // Include TTS settings if provided
            ...(config.conversationConfig?.agent?.tts && {
              tts: config.conversationConfig.agent.tts,
            }),
          },
        },
      }),
    }

    return sessionConfig
  }, [config.dynamicVariables, config.conversationConfig, addDebugLog])

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
      // Clear transcript and reset state when conversation ends
      setTranscript([])
      stopVolumeMonitoring()
      sessionIdRef.current = null
    },
    onMessage: async (message: { source: string; message: string }) => {
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

        // Log agent message to Eden session
        const currentSessionId = sessionIdRef.current
        if (currentSessionId) {
          await logMessageToSession(
            currentSessionId,
            'assistant',
            message.message,
          )
        }
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

        // Log user message to Eden session
        const currentSessionId = sessionIdRef.current
        if (currentSessionId) {
          await logMessageToSession(currentSessionId, 'user', message.message)
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
    onStatusChange: () => {
      // Status changes are tracked via conversation.status
    },
  })

  const startConversation = useCallback(async () => {
    // Fetch configuration if not already loaded
    let currentApiKey = apiKey
    let currentAgentId = agentId

    if (!currentApiKey || !currentAgentId) {
      const configData = await fetchConfig()
      if (!configData) {
        addDebugLog('Failed to load configuration', 'error')
        return
      }
      currentApiKey = configData.apiKey
      currentAgentId = configData.agentId
    }

    let stream: MediaStream | null = null

    try {
      // Request microphone permission with safe configuration
      addDebugLog('Requesting microphone permission...', 'info')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: SAFE_MICROPHONE_CONSTRAINTS,
          video: false,
        })
        addDebugLog('Microphone permission granted', 'success')
      } catch (micError) {
        const micErrorMessage =
          micError instanceof Error ? micError.message : 'Unknown error'
        addDebugLog(
          `Failed to get microphone permission: ${micErrorMessage}. Please allow microphone access in your browser settings.`,
          'error',
        )
        throw micError
      }

      // Start monitoring microphone volume
      startVolumeMonitoring(stream)

      // Create Eden session with user info
      addDebugLog('Creating Eden session...', 'info')
      try {
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
          const newSessionId = sessionData.session?._id
          if (newSessionId) {
            sessionIdRef.current = newSessionId
            addDebugLog(`Session created: ${newSessionId}`, 'success')
          }
        } else {
          const errorText = await sessionResponse.text()
          addDebugLog(
            `Failed to create session: ${sessionResponse.status} ${errorText}`,
            'error',
          )
        }
      } catch (error) {
        const sessionErrorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        addDebugLog(
          `Error creating Eden session: ${sessionErrorMessage}`,
          'error',
        )
      }

      // Prepare conversation config with dynamic variables
      const sessionConfig = prepareConversationConfig()

      // Start the conversation with dynamic variables
      addDebugLog('Starting ElevenLabs conversation...', 'info')
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (conversation.startSession as any)({
          agentId: currentAgentId,
          ...sessionConfig,
        })
        addDebugLog('ElevenLabs conversation started successfully', 'success')
      } catch (elevenLabsError) {
        const elevenLabsErrorMessage =
          elevenLabsError instanceof Error
            ? elevenLabsError.message
            : 'Unknown error'
        addDebugLog(
          `Failed to start ElevenLabs conversation: ${elevenLabsErrorMessage}`,
          'error',
        )
        throw elevenLabsError
      }

      addDebugLog('Connected', 'success')
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      addDebugLog(`Failed to start conversation: ${errorMessage}`, 'error')

      // Cleanup: Stop all tracks on the stream if it was obtained
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        addDebugLog('Microphone stream cleaned up after error', 'info')
      }

      // Cleanup: Stop volume monitoring if it was started
      stopVolumeMonitoring()
    }
  }, [
    apiKey,
    agentId,
    conversation,
    config.edenAgentId,
    config.userInfo,
    prepareConversationConfig,
    addDebugLog,
    startVolumeMonitoring,
    stopVolumeMonitoring,
    fetchConfig,
  ])

  const endConversation = useCallback(async () => {
    try {
      await conversation.endSession()
      stopVolumeMonitoring()
      addDebugLog('Disconnected', 'info')
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
