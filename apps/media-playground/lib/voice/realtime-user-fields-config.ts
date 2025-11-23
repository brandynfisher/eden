// User input fields configuration
export const REALTIME_USER_FIELDS: string[] = ['name', 'email']

export const REALTIME_USER_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  email: 'Email',
}

export const REALTIME_USER_FIELD_TYPES: Record<string, string> = {
  email: 'email',
}

// Agent configuration types
export type LLM =
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'

export interface PromptConfig {
  prompt?: string // Always populated dynamically from agent persona + memory
  llm: LLM
  temperature?: number
  maxTokens?: number
}

export interface TTSConfig {
  voiceId?: string
  stability?: number // 0.0 to 1.0
  speed?: number // 0.7 to 1.2
  similarityBoost?: number // 0.0 to 1.0
}

export interface AgentConfig {
  agent_id?: string // ElevenLabs agent ID override
  firstMessage?: string
  language?: string
  prompt: PromptConfig
  tts?: TTSConfig
}

export interface ConversationConfig {
  agent: AgentConfig
}

// Override types (all fields optional)
export type PromptConfigOverride = Partial<PromptConfig>
export type TTSConfigOverride = Partial<TTSConfig>

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

// Default configuration
export const DEFAULT_AGENT_CONFIG: ConversationConfig = {
  agent: {
    firstMessage:
      'Ik ben het Collectieve Brein van Broehaha. Een levend geheugen van alle gesprekken hier dit weekend. Ik luister naar iedereen die langskomt, ontdek waar mensen en ideeen overlappen en leg connecties. Zin om jezelf even voor te stellen?',
    language: 'nl',
    //firstMessage: 'Whats up? Gigabrain online — what are we building today?',
    //language: 'en',

    prompt: {
      // prompt is always populated dynamically from agent persona + memory
      llm: 'claude-sonnet-4-5',
      temperature: 0.7,
      maxTokens: 4096,
    },
    tts: {
      stability: 0.45,
      speed: 1.2,
      similarityBoost: 0.25,
    },
  },
}

// Merge helper
export function mergeAgentConfig(
  baseConfig: ConversationConfig,
  overrides?: ConversationConfigOverride,
): ConversationConfig {
  if (!overrides?.agent) return baseConfig

  return {
    agent: {
      ...baseConfig.agent,
      ...overrides.agent,
      prompt: {
        ...baseConfig.agent.prompt,
        ...overrides.agent.prompt,
      },
      tts: {
        ...baseConfig.agent.tts,
        ...overrides.agent.tts,
      },
    },
  }
}
