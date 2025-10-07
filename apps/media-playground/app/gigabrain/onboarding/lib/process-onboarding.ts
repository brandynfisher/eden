interface AgentPromptsExtractionResponse {
  persona: string
  description: string
  memory_instructions: string
  cost: number
}

interface AgentArgs {
  persona: string
  description: string
  memory_instructions: string
}

/**
 * Extract agent prompts from a conversation session.
 *
 * This calls the backend which:
 * 1. Fetches all messages from the session
 * 2. Uses LLM to extract persona, description, and memory instructions
 * 3. Returns the extracted data
 */
export async function processOnboardingLLMCalls(
  sessionId: string,
): Promise<AgentArgs> {
  console.log(`[processOnboardingLLMCalls] Starting for session: ${sessionId}`)

  const response = await fetch(`/api/agent_creation/extract_prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(
      '[processOnboardingLLMCalls] Error:',
      response.status,
      errorText,
    )
    throw new Error(`Agent prompts extraction failed: ${response.statusText}`)
  }

  const data: AgentPromptsExtractionResponse = await response.json()

  console.log('[processOnboardingLLMCalls] Extraction completed:')
  console.log(`  - Cost: ${data.cost} manna`)
  console.log(`  - Persona length: ${data.persona.length} chars`)
  console.log(`  - Description length: ${data.description.length} chars`)
  console.log(
    `  - Memory instructions length: ${data.memory_instructions.length} chars`,
  )

  const agentArgs: AgentArgs = {
    persona: data.persona,
    description: data.description,
    memory_instructions: data.memory_instructions,
  }

  console.log('[processOnboardingLLMCalls] Agent args prepared:', agentArgs)

  // Call the agent creation function
  await createAgentFromArgs(agentArgs)

  return agentArgs
}

/**
 * Creates a new agent in the database (stub for now)
 */
async function createAgentFromArgs(agentArgs: AgentArgs): Promise<void> {
  console.log('[createAgentFromArgs] TODO: Implement agent creation')
  console.log('[createAgentFromArgs] Agent args:', agentArgs)
}
