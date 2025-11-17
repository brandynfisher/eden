/**
 * Voice Provider Abstraction Types
 * These types define a common interface for voice conversation providers
 * (e.g., ElevenLabs, OpenAI, etc.)
 */

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
  temperature?: number
  settings?: Record<string, unknown> // Provider-specific settings
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
