/**
 * User input fields configuration for realtime conversations
 *
 * NOTE: User input fields are now configured per-agent in the RealtimeTab UI
 * and stored in the AgentRealtime model. The hardcoded fields below are
 * deprecated and kept only for backwards compatibility.
 */

// Re-export types from the single source of truth
export type { RealtimeLLM as LLM } from './realtime-defaults'
export { DEFAULT_REALTIME_SETTINGS } from './realtime-defaults'

/**
 * @deprecated User input fields are now configured per-agent via RealtimeSettings.user_input_fields
 */
export const REALTIME_USER_FIELDS: string[] = []

/**
 * @deprecated No longer used - field labels are the field names themselves
 */
export const REALTIME_USER_FIELD_LABELS: Record<string, string> = {}

/**
 * @deprecated No longer used - all fields are now free-text inputs
 */
export const REALTIME_USER_FIELD_TYPES: Record<string, string> = {}

// Legacy types for backwards compatibility with conversationConfig
// These are deprecated - use RealtimeSettings instead
export interface PromptConfigOverride {
  prompt?: string
  llm?: string
  temperature?: number
  maxTokens?: number
}

export interface TTSConfigOverride {
  voiceId?: string
  stability?: number
  speed?: number
  similarityBoost?: number
}

export interface AgentConfigOverride {
  agent_id?: string
  firstMessage?: string
  language?: string
  prompt?: PromptConfigOverride
  tts?: TTSConfigOverride
}

export interface ConversationConfigOverride {
  agent?: AgentConfigOverride
}
