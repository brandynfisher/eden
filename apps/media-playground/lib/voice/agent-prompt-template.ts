/**
 * Agent System Prompt Template with Dynamic Variables
 *
 * This template defines the structure of the agent's system prompt using
 * ElevenLabs dynamic variable syntax {{variable_name}}.
 *
 * Dynamic variables are replaced at runtime with actual values when the
 * conversation starts, providing:
 * - Better reliability than overrides
 * - Official ElevenLabs recommended approach
 * - Easier debugging and testing
 * - Clear separation of template vs data
 *
 * @see https://elevenlabs.io/docs/agents-platform/customization/dynamic-variables
 */

/**
 * System prompt template for ElevenLabs agents
 *
 * This template uses dynamic variable placeholders that will be replaced
 * at runtime with actual agent context and user information.
 *
 * Available dynamic variables:
 * - {{agent_name}} - Agent's display name
 * - {{agent_description}} - Agent's description/background
 * - {{agent_persona}} - Agent's personality and behavior guidelines
 * - {{user_memory}} - Personalized memory for the specific user
 * - {{collective_memory}} - Shared knowledge from all user interactions
 * - {{user_name}} - User's name (if provided)
 * - {{user_email}} - User's email (if provided)
 */
export const AGENT_SYSTEM_PROMPT_TEMPLATE = `You are {{agent_name}}.

## Description
{{agent_description}}

## Persona
{{agent_persona}}

## Memory
{{collective_memory}}
`.trim()

/**
 * First message template with personalization
 *
 * This can be customized per agent but supports dynamic user name injection
 */
export function buildFirstMessage(
  baseMessage: string,
  userName?: string,
): string {
  if (userName && userName.trim() !== '') {
    return `Heey ${userName}! ${baseMessage}`
  }

  return baseMessage
}

/**
 * Returns the appropriate system prompt template
 * This can be extended to support multiple template variations
 */
export function getSystemPromptTemplate(): string {
  return AGENT_SYSTEM_PROMPT_TEMPLATE
}
