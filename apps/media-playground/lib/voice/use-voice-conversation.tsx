'use client'

import { SAFE_MICROPHONE_CONSTRAINTS } from './audio-config'
import { validateDynamicVariables } from './build-dynamic-variables'
import { DEFAULT_REALTIME_SETTINGS } from './realtime-defaults'
import {
  ConnectionStatus,
  DebugLog,
  ToolCall,
  TranscriptMessage,
  VoiceConversation,
  VoiceProviderConfig,
} from './types'
// @ts-ignore - Optional dependency
import { useConversation } from '@elevenlabs/react'
import { useCallback, useRef, useState } from 'react'

/**
 * Built-in tool configuration.
 * - waitForResponse: true = blocking (tool waits for Eve to return result)
 * - waitForResponse: false = async (returns immediately, work happens in background)
 */
const BUILT_IN_TOOLS: Record<
  string,
  { waitForResponse: boolean; timeoutSeconds?: number }
> = {
  create: { waitForResponse: true, timeoutSeconds: 120 },
  display: { waitForResponse: true, timeoutSeconds: 30 },
  create_async: { waitForResponse: false },
  eden_search: { waitForResponse: true, timeoutSeconds: 30 },
  lights: { waitForResponse: true, timeoutSeconds: 30 },
}

/**
 * Hook for managing voice conversations with abstracted provider support
 * Currently supports ElevenLabs, designed to be extended for other providers
 */
export function useVoiceConversation(
  config: VoiceProviderConfig & { edenAgentId: string },
): VoiceConversation {
  // eslint-disable-next-line no-unused-vars
  const [_apiKey, setApiKey] = useState<string | null>(null)
  const [agentId, setAgentId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([])
  const [inputVolume, setInputVolume] = useState<number>(0)
  const sessionIdRef = useRef<string | null>(null)
  const billingSessionIdRef = useRef<string | null>(null)
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  )
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

  // Helper function to add tool calls
  const addToolCall = useCallback(
    (
      toolName: string,
      parameters: Record<string, unknown>,
      result?: unknown,
    ) => {
      const timestamp = new Date().toLocaleTimeString()
      setToolCalls(prev => [
        ...prev,
        { timestamp, toolName, parameters, result },
      ])
    },
    [],
  )

  // Helper function to add/update tool call in Eden session
  const saveToolCallToSession = useCallback(
    async (params: {
      sessionId: string
      toolCallId?: string
      toolName: string
      args?: Record<string, unknown>
      status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
      result?: unknown
      error?: string
      taskId?: string
    }) => {
      try {
        const response = await fetch('/api/realtime/session/tool-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: params.sessionId,
            tool_call_id: params.toolCallId,
            tool_name: params.toolName,
            args: params.args,
            status: params.status,
            result: params.result,
            error: params.error,
            task_id: params.taskId,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          addDebugLog(
            `Failed to save tool call: ${response.status} ${errorText}`,
            'error',
          )
          return null
        }

        return await response.json()
      } catch (error) {
        addDebugLog(
          `Error saving tool call: ${
            error instanceof Error ? error.message : String(error)
          }`,
          'error',
        )
        return null
      }
    },
    [addDebugLog],
  )

  // Create a handler for built-in tools that calls our API
  const createBuiltInToolHandler = useCallback(
    (toolName: string) => {
      return async (parameters: Record<string, unknown>): Promise<string> => {
        // Prominent console logging to track tool invocation
        // eslint-disable-next-line no-console
        console.log(
          `%c[TOOL INVOKED] ${toolName}`,
          'background: #4CAF50; color: white; padding: 4px 8px; font-weight: bold;',
        )
        // eslint-disable-next-line no-console
        console.log('[TOOL PARAMS]', JSON.stringify(parameters, null, 2))

        const sessionId = sessionIdRef.current
        if (!sessionId) {
          console.error('[TOOL ERROR] No active session for tool call')
          throw new Error('No active session for tool call')
        }

        addDebugLog(`🔧 TOOL INVOKED: ${toolName}`, 'info')
        addDebugLog(`Tool params: ${JSON.stringify(parameters)}`, 'info')

        // Step 1: Create pending tool call in Eden session
        const pendingToolCall = await saveToolCallToSession({
          sessionId,
          toolName,
          args: parameters,
          status: 'pending',
        })

        const toolCallId = pendingToolCall?.tool_call_id

        try {
          // Step 2: Execute the tool via Eve API
          const response = await fetch('/api/realtime/tool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool_name: toolName,
              args: parameters,
              session_id: sessionId,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Tool API error: ${response.status} ${errorText}`)
          }

          const result = await response.json()
          addToolCall(toolName, parameters, result)

          // Step 3: Update tool call with result in Eden session
          if (toolCallId) {
            if (result.status === 'completed') {
              await saveToolCallToSession({
                sessionId,
                toolCallId,
                toolName,
                status: 'completed',
                result: result.result,
                taskId: result.task_id,
              })
            } else if (result.status === 'pending') {
              // Async tool - mark as running since work continues in background
              await saveToolCallToSession({
                sessionId,
                toolCallId,
                toolName,
                status: 'running',
                taskId: result.task_id,
              })
            } else if (result.status === 'failed') {
              await saveToolCallToSession({
                sessionId,
                toolCallId,
                toolName,
                status: 'failed',
                error: result.error,
              })
            }
          }

          // Format response for ElevenLabs agent
          if (result.status === 'completed') {
            addDebugLog(`Tool ${toolName} completed`, 'success')
            // Return the result in a format the agent can understand
            return JSON.stringify({
              success: true,
              task_id: result.task_id,
              result: result.result,
            })
          } else if (result.status === 'pending') {
            addDebugLog(`Tool ${toolName} started in background`, 'info')
            // For async tools, return acknowledgment
            return result.message || "I've started working on that."
          } else if (result.status === 'failed') {
            addDebugLog(`Tool ${toolName} failed: ${result.error}`, 'error')
            return JSON.stringify({
              success: false,
              error: result.error,
            })
          }

          return JSON.stringify(result)
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error)

          // Update tool call with error
          if (toolCallId) {
            await saveToolCallToSession({
              sessionId,
              toolCallId,
              toolName,
              status: 'failed',
              error: errorMessage,
            })
          }

          addToolCall(toolName, parameters, { error: errorMessage })
          addDebugLog(`Tool ${toolName} failed: ${errorMessage}`, 'error')
          throw error
        }
      }
    },
    [addDebugLog, addToolCall, saveToolCallToSession],
  )

  // Build all built-in tool handlers
  const getBuiltInToolHandlers = useCallback(() => {
    const handlers: Record<
      string,
      (params: Record<string, unknown>) => Promise<string>
    > = {}

    // eslint-disable-next-line no-console
    console.log(
      '%c[TOOL SETUP] Building handlers for tools:',
      'background: #2196F3; color: white; padding: 2px 6px;',
      Object.keys(BUILT_IN_TOOLS),
    )

    for (const toolName of Object.keys(BUILT_IN_TOOLS)) {
      handlers[toolName] = createBuiltInToolHandler(toolName)
      // eslint-disable-next-line no-console
      console.log(`[TOOL SETUP] Registered handler for: ${toolName}`)
    }

    return handlers
  }, [createBuiltInToolHandler])

  // Wrap client tools to log them before executing
  const wrapClientTools = useCallback(
    (
      clientTools:
        | Record<
            string,
            (params: Record<string, unknown>) => unknown | Promise<unknown>
          >
        | undefined,
    ) => {
      if (!clientTools) {
        // eslint-disable-next-line no-console
        console.log('[TOOL WRAP] No client tools to wrap')
        return undefined
      }

      // eslint-disable-next-line no-console
      console.log(
        '%c[TOOL WRAP] Wrapping tools:',
        'background: #FF9800; color: white; padding: 2px 6px;',
        Object.keys(clientTools),
      )

      const wrappedTools: Record<
        string,
        (params: Record<string, unknown>) => Promise<unknown>
      > = {}

      for (const [toolName, handler] of Object.entries(clientTools)) {
        wrappedTools[toolName] = async (
          parameters: Record<string, unknown>,
        ) => {
          // Log when ElevenLabs invokes a tool through the wrapper
          // eslint-disable-next-line no-console
          console.log(
            `%c[ELEVENLABS TOOL CALL] ${toolName}`,
            'background: #9C27B0; color: white; padding: 4px 8px; font-weight: bold;',
          )
          // eslint-disable-next-line no-console
          console.log('[ELEVENLABS TOOL PARAMS]', parameters)
          addDebugLog(`🎙️ ElevenLabs calling tool: ${toolName}`, 'info')

          try {
            const result = await handler(parameters)
            // eslint-disable-next-line no-console
            console.log(`[TOOL RESULT] ${toolName}:`, result)
            addToolCall(toolName, parameters, result)
            addDebugLog(`Tool ${toolName} completed successfully`, 'success')
            return result
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error)
            console.error(`[TOOL ERROR] ${toolName}:`, errorMessage)
            addToolCall(toolName, parameters, { error: errorMessage })
            addDebugLog(`Tool ${toolName} failed: ${errorMessage}`, 'error')
            throw error
          }
        }
      }

      // eslint-disable-next-line no-console
      console.log('[TOOL WRAP] Final wrapped tools:', Object.keys(wrappedTools))
      return wrappedTools
    },
    [addDebugLog, addToolCall],
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

  // Prepare conversation config with dynamic variables and realtime settings
  // This uses ElevenLabs' recommended dynamic variables approach for prompt content
  // and overrides for other settings (language, voice, TTS, LLM)
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

    const { realtimeSettings } = config
    const defaults = DEFAULT_REALTIME_SETTINGS

    // Build overrides from realtime settings
    // These configure the ElevenLabs agent behavior (language, voice, LLM, TTS, first_message)
    // Note: tts is a SIBLING of agent, not nested inside it
    // See: https://elevenlabs.io/docs/agents-platform/customization/personalization/overrides
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const overrides: any = {
      agent: {
        language: realtimeSettings.language || defaults.language,
        // Set firstMessage override if available from dynamic variables
        ...(config.dynamicVariables.first_message && {
          firstMessage: config.dynamicVariables.first_message,
        }),
        prompt: {
          llm: realtimeSettings.llm_model || defaults.llm_model,
          temperature: realtimeSettings.temperature ?? defaults.temperature,
          max_tokens: realtimeSettings.max_tokens ?? defaults.max_tokens,
        },
      },
      // TTS overrides are at the top level (sibling of agent), not nested inside agent
      tts: {
        ...(realtimeSettings.voice_id && {
          voiceId: realtimeSettings.voice_id,
        }),
        model_id: realtimeSettings.tts_model ?? defaults.tts_model,
        stability: realtimeSettings.tts_stability ?? defaults.tts_stability,
        speed: realtimeSettings.tts_speed ?? defaults.tts_speed,
        similarityBoost:
          realtimeSettings.tts_similarity_boost ??
          defaults.tts_similarity_boost,
      },
    }

    addDebugLog(
      `Using realtime settings: language=${overrides.agent.language}, llm=${
        overrides.agent.prompt.llm
      }, voice_id=${realtimeSettings.voice_id || 'default'}, first_message=${
        config.dynamicVariables.first_message ? 'set' : 'empty'
      }`,
      'info',
    )

    // Return config for ElevenLabs startSession
    // Dynamic variables are used for prompt content (agent_system_prompt, first_message)
    // Overrides are used for other settings (language, voice, LLM, TTS)
    const sessionConfig = {
      dynamicVariables: config.dynamicVariables,
      overrides,
    }

    return sessionConfig
  }, [config.dynamicVariables, config.realtimeSettings, addDebugLog])

  // Initialize ElevenLabs conversation
  // Note: For public agents, we don't pass the API key (it's not needed and shouldn't be exposed)
  // For private agents, we would need to use conversation tokens generated server-side
  const conversation = useConversation({
    onConnect: (props: { conversationId: string }) => {
      // eslint-disable-next-line no-console
      console.log(
        '%c[ELEVENLABS CONNECTED]',
        'background: #4CAF50; color: white; padding: 4px 8px; font-weight: bold;',
        'Conversation ID:',
        props.conversationId,
      )
      addDebugLog(
        `Connected to agent (conversation: ${props.conversationId})`,
        'success',
      )
    },
    onDisconnect: (reason: unknown) => {
      addDebugLog(
        `Disconnected from agent. Reason: ${JSON.stringify(reason)}`,
        'warning',
      )
      // Clear transcript, tool calls and reset state when conversation ends
      setTranscript([])
      setToolCalls([])
      stopVolumeMonitoring()
      sessionIdRef.current = null

      // Stop heartbeat and close billing session
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      if (billingSessionIdRef.current) {
        fetch(`/api/realtime/billing/${billingSessionIdRef.current}/close`, {
          method: 'POST',
        }).catch(err => console.error('Failed to close billing session:', err))
        billingSessionIdRef.current = null
      }
    },
    onMessage: async (message: { source: string; message: string }) => {
      // Log all messages for debugging
      // eslint-disable-next-line no-console
      console.log(
        `%c[ELEVENLABS MESSAGE] ${message.source}`,
        message.source === 'ai'
          ? 'background: #3F51B5; color: white; padding: 2px 6px;'
          : 'background: #009688; color: white; padding: 2px 6px;',
        message.message.substring(0, 100) +
          (message.message.length > 100 ? '...' : ''),
      )

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
    onError: (error: unknown, context?: unknown) => {
      const errorMessage =
        typeof error === 'string'
          ? error
          : error instanceof Error
          ? error.message
          : JSON.stringify(error)
      console.error('[ELEVENLABS ERROR]', errorMessage, context)
      addDebugLog(`Error: ${errorMessage}`, 'error')
    },
    onStatusChange: (props: { status: string }) => {
      // eslint-disable-next-line no-console
      console.log(
        `%c[ELEVENLABS STATUS] ${props.status}`,
        'background: #607D8B; color: white; padding: 2px 6px;',
      )
      addDebugLog(`Status: ${props.status}`, 'info')
    },
    onModeChange: (props: { mode: string }) => {
      // Mode changes between "speaking" and "listening"
      // Tool execution may trigger mode changes
      // eslint-disable-next-line no-console
      console.log(
        `%c[ELEVENLABS MODE] ${props.mode}`,
        'background: #795548; color: white; padding: 2px 6px;',
      )
      addDebugLog(`Mode: ${props.mode}`, 'info')
    },
  })

  const startConversation = useCallback(async () => {
    // Use per-agent ElevenLabs agent ID if configured, otherwise fall back to default
    let currentAgentId = config.realtimeSettings.elevenlabs_agent_id || agentId

    if (!currentAgentId) {
      const configData = await fetchConfig()
      if (!configData) {
        addDebugLog('Failed to load configuration', 'error')
        return
      }
      currentAgentId = configData.agentId
    }

    if (config.realtimeSettings.elevenlabs_agent_id) {
      addDebugLog(
        `Using per-agent ElevenLabs ID: ${config.realtimeSettings.elevenlabs_agent_id}`,
        'info',
      )
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

      // Start billing session
      addDebugLog('Starting billing session...', 'info')
      try {
        const billingResponse = await fetch('/api/realtime/billing/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: config.edenAgentId,
            sessionId: sessionIdRef.current,
          }),
        })

        if (billingResponse.ok) {
          const billingData = await billingResponse.json()
          const billingSessionId = billingData.realtimeSession?._id
          if (billingSessionId) {
            billingSessionIdRef.current = billingSessionId
            addDebugLog(
              `Billing session started: ${billingSessionId}`,
              'success',
            )

            // Start heartbeat interval (every 30 seconds)
            heartbeatIntervalRef.current = setInterval(async () => {
              if (billingSessionIdRef.current) {
                try {
                  const heartbeatRes = await fetch(
                    `/api/realtime/billing/${billingSessionIdRef.current}/heartbeat`,
                    { method: 'POST' },
                  )
                  if (!heartbeatRes.ok) {
                    // Consume the response body
                    await heartbeatRes.json()
                    if (heartbeatRes.status === 402) {
                      addDebugLog(
                        'Insufficient manna - ending session',
                        'error',
                      )
                      // Session was closed by API, stop heartbeat
                      if (heartbeatIntervalRef.current) {
                        clearInterval(heartbeatIntervalRef.current)
                        heartbeatIntervalRef.current = null
                      }
                      billingSessionIdRef.current = null
                    }
                  }
                } catch (err) {
                  console.error('Heartbeat error:', err)
                }
              }
            }, 30000)
          }
        } else {
          const errorData = await billingResponse.json()
          if (billingResponse.status === 402) {
            addDebugLog(`Insufficient manna: ${errorData.message}`, 'error')
            throw new Error(errorData.message || 'Insufficient manna balance')
          } else {
            addDebugLog(
              `Failed to start billing: ${billingResponse.status} ${errorData.message}`,
              'error',
            )
          }
        }
      } catch (error) {
        const billingErrorMessage =
          error instanceof Error ? error.message : 'Unknown error'
        addDebugLog(
          `Error starting billing session: ${billingErrorMessage}`,
          'error',
        )
        // If billing failed due to insufficient manna, stop here
        if (billingErrorMessage.includes('manna')) {
          throw error
        }
      }

      // Prepare conversation config with dynamic variables
      const sessionConfig = prepareConversationConfig()

      // Get built-in tool handlers (create, display, create_async)
      // These must match the tools configured in the ElevenLabs agent dashboard
      const builtInTools = getBuiltInToolHandlers()

      // Merge built-in tools with any custom client tools (custom overrides built-in)
      const allClientTools = {
        ...builtInTools,
        ...config.clientTools,
      }

      // Wrap all tools to log them (only if there are any tools)
      const wrappedClientTools =
        Object.keys(allClientTools).length > 0
          ? wrapClientTools(allClientTools)
          : undefined

      // Start the conversation with dynamic variables and client tools
      addDebugLog('Starting ElevenLabs conversation...', 'info')
      addDebugLog(`Agent ID: ${currentAgentId}`, 'info')

      const builtInToolNames = Object.keys(builtInTools)
      const customToolNames = Object.keys(config.clientTools || {})
      addDebugLog(
        `Tools: ${
          [...builtInToolNames, ...customToolNames].join(', ') || 'none'
        }`,
        'info',
      )

      // Log the full session config for debugging
      // eslint-disable-next-line no-console
      console.log('[ElevenLabs] Session config:', {
        agentId: currentAgentId,
        ...sessionConfig,
        clientTools: wrappedClientTools ? Object.keys(wrappedClientTools) : [],
      })

      try {
        // Check if using a per-agent ElevenLabs agent ID
        const usingCustomAgent = !!config.realtimeSettings.elevenlabs_agent_id

        // Build the config
        // - If using custom agent: skip overrides (agent has settings baked in)
        // - If using default shared agent: apply overrides for voice, language, TTS
        const fullConfig = {
          agentId: currentAgentId,
          dynamicVariables: sessionConfig.dynamicVariables,
          // Only apply overrides when using the default shared agent
          ...(!usingCustomAgent && { overrides: sessionConfig.overrides }),
          ...(wrappedClientTools && { clientTools: wrappedClientTools }),
        }

        // Detailed logging of what's being sent to ElevenLabs
        // eslint-disable-next-line no-console
        console.log(
          '%c[ELEVENLABS CONFIG] Starting session with:',
          'background: #E91E63; color: white; padding: 4px 8px; font-weight: bold;',
        )
        // eslint-disable-next-line no-console
        console.log('[ELEVENLABS CONFIG] Agent ID:', currentAgentId)
        // eslint-disable-next-line no-console
        console.log(
          '[ELEVENLABS CONFIG] Using custom agent:',
          usingCustomAgent
            ? 'YES (skipping overrides)'
            : 'NO (applying overrides)',
        )
        // eslint-disable-next-line no-console
        console.log(
          '[ELEVENLABS CONFIG] Client tools registered:',
          wrappedClientTools ? Object.keys(wrappedClientTools) : 'NONE',
        )
        // eslint-disable-next-line no-console
        console.log(
          '[ELEVENLABS CONFIG] Dynamic variables:',
          Object.keys(sessionConfig.dynamicVariables),
        )
        // eslint-disable-next-line no-console
        console.log('[ELEVENLABS CONFIG] Full config:', fullConfig)

        addDebugLog(
          `Registering ${
            wrappedClientTools ? Object.keys(wrappedClientTools).length : 0
          } tools with ElevenLabs`,
          'info',
        )
        if (!usingCustomAgent) {
          addDebugLog(
            `Applying overrides: voice=${
              sessionConfig.overrides?.tts?.voiceId || 'default'
            }, language=${
              sessionConfig.overrides?.agent?.language || 'default'
            }`,
            'info',
          )
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (conversation.startSession as any)(fullConfig)
        addDebugLog('ElevenLabs conversation started successfully', 'success')
        // eslint-disable-next-line no-console
        console.log(
          '%c[ELEVENLABS] Session started successfully',
          'background: #4CAF50; color: white; padding: 2px 6px;',
        )
      } catch (elevenLabsError) {
        let elevenLabsErrorMessage: string
        if (elevenLabsError instanceof Error) {
          elevenLabsErrorMessage = elevenLabsError.message
        } else if (typeof elevenLabsError === 'string') {
          elevenLabsErrorMessage = elevenLabsError
        } else if (
          elevenLabsError &&
          typeof elevenLabsError === 'object' &&
          'message' in elevenLabsError
        ) {
          elevenLabsErrorMessage = String(
            (elevenLabsError as { message: unknown }).message,
          )
        } else {
          try {
            elevenLabsErrorMessage = JSON.stringify(elevenLabsError)
          } catch {
            elevenLabsErrorMessage = String(elevenLabsError)
          }
        }
        addDebugLog(
          `Failed to start ElevenLabs conversation: ${elevenLabsErrorMessage}`,
          'error',
        )
        throw elevenLabsError
      }

      addDebugLog('Connected', 'success')
    } catch (error: unknown) {
      let errorMessage: string
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message)
      } else {
        try {
          errorMessage = JSON.stringify(error)
        } catch {
          errorMessage = String(error)
        }
      }
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
    agentId,
    conversation,
    config.edenAgentId,
    config.userInfo,
    config.clientTools,
    config.realtimeSettings,
    prepareConversationConfig,
    getBuiltInToolHandlers,
    wrapClientTools,
    addDebugLog,
    startVolumeMonitoring,
    stopVolumeMonitoring,
    fetchConfig,
  ])

  const endConversation = useCallback(async () => {
    try {
      // Stop heartbeat first
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }

      // Close billing session
      if (billingSessionIdRef.current) {
        try {
          const closeRes = await fetch(
            `/api/realtime/billing/${billingSessionIdRef.current}/close`,
            { method: 'POST' },
          )
          if (closeRes.ok) {
            const closeData = await closeRes.json()
            addDebugLog(
              `Billing session closed. Total billed: ${closeData.totalMannaBilled} manna`,
              'info',
            )
          }
        } catch (err) {
          console.error('Failed to close billing session:', err)
        }
        billingSessionIdRef.current = null
      }

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
    toolCalls,
    inputVolume,
    startConversation,
    endConversation,
    addDebugLog,
  }
}
