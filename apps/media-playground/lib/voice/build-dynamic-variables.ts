/**
 * Dynamic Variables Builder for ElevenLabs Agents
 *
 * This module prepares dynamic variables to be injected into ElevenLabs conversations.
 * Dynamic variables allow runtime personalization without using the override system.
 *
 * Key benefits over overrides:
 * - More reliable and officially recommended by ElevenLabs
 * - Variables are properly injected into system prompts at runtime
 * - Cleaner separation between static config and dynamic data
 * - Better debugging and auditability
 *
 * @see https://elevenlabs.io/docs/agents-platform/customization/dynamic-variables
 */

export interface AgentContext {
  description: string
  persona: string
  memory: {
    userMemory: string
    collectiveMemory: Array<{ shard_name: string; content: string }>
  }
}

export interface AgentData {
  name: string
}

/**
 * Dynamic variables that will be injected into the ElevenLabs agent
 * All variables will be available as {{variable_name}} in the agent's system prompt
 */
export interface DynamicVariables {
  // Complete system prompt constructed from all components
  agent_system_prompt: string

  // First message with personalization
  first_message: string
}

/**
 * Prepares dynamic variables from agent context and user information
 *
 * @param agentContext - Agent's description, persona, and memory data
 * @param agentData - Agent's basic data like name
 * @param userInfo - Optional user-provided information for personalization
 * @param baseFirstMessage - Base first message template
 * @returns Object containing all dynamic variables ready for ElevenLabs
 */
export function buildDynamicVariables(
  agentContext: AgentContext,
  agentData: AgentData,
  userInfo?: Record<string, string>,
  baseFirstMessage?: string,
): DynamicVariables {
  // Build collective memory as a formatted string
  const collectiveMemoryFormatted = agentContext.memory.collectiveMemory
    .map(shard => `[${shard.shard_name}]: ${shard.content}`)
    .join('\n\n')

  // Build the complete system prompt from template
  const systemPrompt = `You are ${agentData.name}.

## Description
${agentContext.description || ''}

## Persona
${agentContext.persona || ''}

## User Memory
The following is what you remember about this specific user from previous interactions:

${agentContext.memory.userMemory || ''}

## Collective Knowledge
The following is collective knowledge gathered from all users and conversations:

${collectiveMemoryFormatted || ''}`.trim()

  // Build first message with personalization
  let firstMessage = baseFirstMessage || ''

  // Extract user name if provided
  const userName = userInfo?.name || userInfo?.Name || ''

  if (userName && userName.trim() !== '' && firstMessage) {
    firstMessage = `Heey ${userName}! ${firstMessage}`
  }

  const variables: DynamicVariables = {
    agent_system_prompt: systemPrompt,
    first_message: firstMessage,
  }

  return variables
}

/**
 * Formats dynamic variables for display/debugging
 * Useful for showing what variables are being sent to ElevenLabs
 */
export function formatDynamicVariablesForDisplay(
  variables: DynamicVariables,
): string {
  const entries = Object.entries(variables)
    .filter(([, value]) => value && value.length > 0)
    .map(([key, value]) => {
      // TypeScript guard: filter above ensures value is defined and has length
      if (!value) return ''
      const preview =
        value.length > 100 ? `${value.substring(0, 100)}...` : value
      return `  ${key}: ${preview} (${value.length} chars)`
    })
    .filter(entry => entry !== '')

  return `Dynamic Variables:\n${entries.join('\n')}`
}

/**
 * Validates that all required dynamic variables are present
 * Useful for debugging and ensuring data integrity
 */
export function validateDynamicVariables(variables: DynamicVariables): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (
    !variables.agent_system_prompt ||
    variables.agent_system_prompt.trim() === ''
  ) {
    errors.push('agent_system_prompt is required but empty')
  }

  // Recommended fields
  if (!variables.first_message || variables.first_message.trim() === '') {
    warnings.push('first_message is empty - agent may not greet user')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
