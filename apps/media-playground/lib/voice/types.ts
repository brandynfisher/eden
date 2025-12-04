/**
 * Voice Provider Abstraction Types
 * These types define a common interface for voice conversation providers
 * (e.g., ElevenLabs, OpenAI, etc.)
 */
import type { DynamicVariables } from './build-dynamic-variables'
import type { RealtimeSettings } from './realtime-defaults'

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error'

export interface TranscriptMessage {
  role: 'user' | 'agent'
  text: string
  timestamp: string
  isFinal: boolean
}

export interface DebugLog {
  timestamp: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'debug'
}

/**
 * Represents a tool call made by the agent during conversation
 */
export interface ToolCall {
  timestamp: string
  toolName: string
  parameters: Record<string, unknown>
  result?: unknown
}

/**
 * Client tool handler function type
 * Parameters are passed from ElevenLabs based on dashboard configuration
 * Return value is sent back to agent if "Wait for response" is enabled
 */
export type ClientToolHandler = (
  parameters: Record<string, unknown>,
) => unknown | Promise<unknown>

export interface VoiceProviderConfig {
  provider: 'elevenlabs' // Can extend to 'openai' | 'other' in future
  /**
   * Dynamic variables to inject into the agent's system prompt
   * These are the recommended way to pass runtime data to ElevenLabs agents
   * @see https://elevenlabs.io/docs/agents-platform/customization/dynamic-variables
   */
  dynamicVariables: DynamicVariables
  /**
   * Optional user information for conversation personalization
   * This is used to build dynamic variables and stored in the Eden session
   * Flexible object that can contain any fields (name, email, etc.)
   */
  userInfo?: Record<string, string>
  /**
   * Realtime settings from the database (voice_id, language, LLM, TTS, etc.)
   * These are used to configure the ElevenLabs conversation session
   */
  realtimeSettings: RealtimeSettings
  /**
   * Client tools that can be invoked by the agent during conversation
   * Tool names must match exactly with ElevenLabs dashboard configuration
   * @see https://elevenlabs.io/docs/agents-platform/customization/tools/client-tools
   */
  clientTools?: Record<string, ClientToolHandler>
}

export interface VoiceConversationState {
  status: ConnectionStatus
  isSpeaking: boolean
  canSendFeedback: boolean
  transcript: TranscriptMessage[]
  debugLogs: DebugLog[]
  toolCalls: ToolCall[] // Tool calls made during conversation
  inputVolume: number // 0-100 representing microphone input volume
}

export interface VoiceConversationActions {
  startConversation: () => Promise<void>
  endConversation: () => Promise<void>
  addDebugLog: (message: string, type?: DebugLog['type']) => void
}

export type VoiceConversation = VoiceConversationState &
  VoiceConversationActions
