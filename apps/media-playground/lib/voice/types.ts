/**
 * Voice Provider Abstraction Types
 * These types define a common interface for voice conversation providers
 * (e.g., ElevenLabs, OpenAI, etc.)
 */
import type { ConversationConfigOverride } from './agent-config'

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
  agentPrompt: string
  /**
   * Optional ElevenLabs conversation config overrides
   * This matches the ElevenLabs API structure and allows overriding any settings
   */
  conversationConfig?: ConversationConfigOverride
}

export interface VoiceConversationState {
  status: ConnectionStatus
  isSpeaking: boolean
  canSendFeedback: boolean
  transcript: TranscriptMessage[]
  debugLogs: DebugLog[]
}

export interface VoiceConversationActions {
  startConversation: () => Promise<void>
  endConversation: () => Promise<void>
  addDebugLog: (message: string, type?: DebugLog['type']) => void
}

export type VoiceConversation = VoiceConversationState &
  VoiceConversationActions
