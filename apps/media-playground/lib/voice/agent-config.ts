/**
 * Agent Configuration Types
 *
 * These types match the ElevenLabs API structure for agent configuration.
 * Reference: https://elevenlabs.io/docs/api-reference/agents/update
 */

export type LLM =
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gemini-2.0-flash-lite'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'

export interface PromptConfig {
  prompt: string
  llm: LLM
  temperature?: number
  maxTokens?: number
}

export interface AgentConfig {
  first_message?: string
  language?: string
  prompt: PromptConfig
}

export interface ConversationConfig {
  agent: AgentConfig
}

/**
 * Partial types for config overrides
 * These allow you to override only specific nested properties
 */
export type PromptConfigOverride = Partial<PromptConfig>

export interface AgentConfigOverride {
  first_message?: string
  language?: string
  prompt?: PromptConfigOverride
}

export interface ConversationConfigOverride {
  agent?: AgentConfigOverride
}

/**
 * Default ElevenLabs Agent Configuration
 *
 * This is the SINGLE SOURCE OF TRUTH for all agent settings.
 * Change these values to update defaults across all conversations.
 * Individual conversations can override specific settings if needed.
 */
export const DEFAULT_AGENT_CONFIG: ConversationConfig = {
  agent: {
    prompt: {
      prompt: '', // will be set dynamically from agent context
      llm: 'claude-sonnet-4-5', // Main LLM model to use
      temperature: 0.7, // Creativity level (0-1)
      maxTokens: 4096, // Max tokens per response
    },
  },
}

/**
 * Helper to merge user config overrides with defaults
 */
export function mergeAgentConfig(
  baseConfig: ConversationConfig,
  overrides?: ConversationConfigOverride,
): ConversationConfig {
  if (!overrides || !overrides.agent) return baseConfig

  return {
    agent: {
      ...baseConfig.agent,
      ...overrides.agent,
      prompt: {
        ...baseConfig.agent.prompt,
        ...overrides.agent?.prompt,
      },
    },
  }
}
