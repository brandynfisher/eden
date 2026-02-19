/**
 * Agent System Prompt Template — Documentation Only
 *
 * The system prompt is now assembled server-side by the
 * /v2/agents/:agentId/memory-context endpoint and returned
 * as agent_system_prompt. The template below documents the structure.
 *
 * ElevenLabs dynamic variables:
 * - {{agent_system_prompt}} - Complete system prompt (built server-side)
 * - {{first_message}} - Personalized greeting (built client-side)
 *
 * @see https://elevenlabs.io/docs/agents-platform/customization/dynamic-variables
 */

export const AGENT_SYSTEM_PROMPT_TEMPLATE = `You are {agent_name}.

## Description
{agent_description}

## Persona
{agent_persona}

## Memory
<MemoryContext>
  <AgentMemory>...</AgentMemory>
  <UserMemory>...</UserMemory>
  <Facts>...</Facts>
</MemoryContext>
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
