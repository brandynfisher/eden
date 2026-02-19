/**
 * Dynamic Variables Builder for ElevenLabs Agents
 *
 * This module prepares dynamic variables to be injected into ElevenLabs conversations.
 * The system prompt (agent_system_prompt) is now assembled server-side by the
 * /v2/agents/:agentId/memory-context endpoint. The frontend only handles
 * first_message personalization.
 *
 * @see https://elevenlabs.io/docs/agents-platform/customization/dynamic-variables
 */

export interface AgentContext {
  agentSystemPrompt: string // Pre-assembled system prompt from backend
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
 * @param agentContext - Pre-assembled agent system prompt from backend
 * @param userInfo - Optional user-provided information for personalization
 * @param baseFirstMessage - Base first message template
 * @returns Object containing all dynamic variables ready for ElevenLabs
 */
export function buildDynamicVariables(
  agentContext: AgentContext,
  userInfo?: Record<string, string>,
  baseFirstMessage?: string,
): DynamicVariables {
  // System prompt comes pre-built from backend
  const systemPrompt = agentContext.agentSystemPrompt || ''

  // Build first message with personalization
  let firstMessage = baseFirstMessage || ''
  const userName = extractUserName(userInfo)
  if (userName && firstMessage) {
    firstMessage = `Hey ${userName}! ${firstMessage}`
  }

  return {
    agent_system_prompt: systemPrompt,
    first_message: firstMessage,
  }
}

/**
 * Extract user name from user info, checking common field variations
 */
function extractUserName(userInfo?: Record<string, string>): string {
  if (!userInfo) return ''
  const usernameFields = [
    'name',
    'Name',
    'NAME',
    'username',
    'userName',
    'Username',
    'UserName',
    'user',
    'User',
    'USER',
    'fullName',
    'full_name',
    'displayName',
    'display_name',
    'firstName',
    'first_name',
    'naam',
    'Naam',
    'nickname',
    'Nickname',
  ]
  const matchedField = usernameFields.find(field => userInfo[field]?.trim())
  return matchedField ? userInfo[matchedField] : ''
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
