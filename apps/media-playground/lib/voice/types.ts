/**
 * Voice Provider Abstraction Types
 * These types define a common interface for voice conversation providers
 * (e.g., ElevenLabs, OpenAI, etc.)
 */
import type { DynamicVariables } from './build-dynamic-variables'
import type { ConversationConfigOverride } from './realtime-user-fields-config'

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
   * Optional ElevenLabs conversation config overrides
   * Used for settings like language, TTS config, etc. (not for prompt content)
   */
  conversationConfig?: ConversationConfigOverride
}

export interface VoiceConversationState {
  status: ConnectionStatus
  isSpeaking: boolean
  canSendFeedback: boolean
  transcript: TranscriptMessage[]
  debugLogs: DebugLog[]
  inputVolume: number // 0-100 representing microphone input volume
}

export interface VoiceConversationActions {
  startConversation: () => Promise<void>
  endConversation: () => Promise<void>
  addDebugLog: (message: string, type?: DebugLog['type']) => void
}

export type VoiceConversation = VoiceConversationState &
  VoiceConversationActions
