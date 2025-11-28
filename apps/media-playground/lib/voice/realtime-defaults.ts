/**
 * Default realtime settings for ElevenLabs conversations
 * This is the single source of truth for all default values
 */

/**
 * Hardcoded ElevenLabs Agent ID
 * This is the conversational agent ID used for all realtime conversations
 */
export const ELEVENLABS_AGENT_ID = 'agent_1501k7xznma4fnprjh81qvanzrrr'

export type RealtimeLLM =
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gemini-2.5-flash'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'

export interface RealtimeSettings {
  agent: string
  voice_id?: string | null
  language: string
  first_message?: string | null
  llm_model: RealtimeLLM
  temperature: number
  max_tokens: number
  tts_stability: number
  tts_speed: number
  tts_similarity_boost: number
  /** User input field labels to collect before conversation starts */
  user_input_fields?: string[]
}

/**
 * Default realtime settings matching the AgentRealtime model defaults
 */
export const DEFAULT_REALTIME_SETTINGS: RealtimeSettings = {
  agent: '',
  voice_id: 'alFofuDn3cOwyoz1i44T',
  first_message: 'Hey there, how are you doing today?',
  language: 'en',
  llm_model: 'claude-haiku-4-5',
  temperature: 0.8,
  max_tokens: 4096,
  tts_stability: 0.5,
  tts_speed: 1.0,
  tts_similarity_boost: 0.3,
  user_input_fields: [],
}
