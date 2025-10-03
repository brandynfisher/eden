import { onboardingPrompts } from '../onboarding_config'
import { Message } from '@edenlabs/eden-sdk'

interface AsyncLLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface AsyncLLMCallRequest {
  messages: AsyncLLMMessage[]
  system_message?: string
  model?: string
  tools?: string[]
}

interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

interface AsyncLLMCallResponse {
  content: string
  tool_calls?: ToolCall[]
  stop: boolean
  cost: number
}

interface AgentArgs {
  persona: string
  summary: string
  memory_instructions: string
}

/**
 * Fetches all messages from a session in chronological order
 */
async function fetchSessionMessages(sessionId: string): Promise<Message[]> {
  const response = await fetch(`/api/sessions/${sessionId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch session: ${response.statusText}`)
  }

  const data = await response.json()
  return data.session?.messages || []
}

/**
 * Formats messages into a conversation string for prompt injection
 */
function formatConversation(messages: Message[]): string {
  return messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .map(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant'
      return `${role}: ${msg.content}`
    })
    .join('\n\n')
}

/**
 * Calls the async LLM endpoint
 */
async function callAsyncLLM(
  request: AsyncLLMCallRequest,
): Promise<AsyncLLMCallResponse> {
  const response = await fetch(`/api/llm/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error(`LLM call failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Processes all three async LLM calls in parallel
 */
export async function processOnboardingLLMCalls(
  sessionId: string,
): Promise<AgentArgs> {
  console.log(`[processOnboardingLLMCalls] Starting for session: ${sessionId}`)

  // Fetch all messages from the session
  const messages = await fetchSessionMessages(sessionId)
  console.log(`[processOnboardingLLMCalls] Fetched ${messages.length} messages`)

  // Format the conversation
  const conversationText = formatConversation(messages)
  console.log(
    `[processOnboardingLLMCalls] Formatted conversation (${conversationText.length} chars)`,
  )

  // Prepare the three prompts by injecting the conversation
  const personaPrompt = onboardingPrompts.persona_extraction.replace(
    '{CONVERSATION}',
    conversationText,
  )
  const summaryPrompt = onboardingPrompts.summary_extraction.replace(
    '{CONVERSATION}',
    conversationText,
  )
  const memoryPrompt = onboardingPrompts.memory_instructions.replace(
    '{CONVERSATION}',
    conversationText,
  )

  // Execute all three LLM calls in parallel
  console.log('[processOnboardingLLMCalls] Triggering 3 parallel LLM calls...')
  const [personaResponse, summaryResponse, memoryResponse] = await Promise.all([
    callAsyncLLM({
      messages: [{ role: 'user', content: personaPrompt }],
    }),
    callAsyncLLM({
      messages: [{ role: 'user', content: summaryPrompt }],
    }),
    callAsyncLLM({
      messages: [{ role: 'user', content: memoryPrompt }],
    }),
  ])

  console.log('[processOnboardingLLMCalls] All LLM calls completed:')
  console.log(`  - Persona extraction cost: ${personaResponse.cost} manna`)
  console.log(`  - Summary extraction cost: ${summaryResponse.cost} manna`)
  console.log(`  - Memory instructions cost: ${memoryResponse.cost} manna`)
  console.log(
    `  - Total cost: ${
      personaResponse.cost + summaryResponse.cost + memoryResponse.cost
    } manna`,
  )

  // Return the agent args
  const agentArgs: AgentArgs = {
    persona: personaResponse.content,
    summary: summaryResponse.content,
    memory_instructions: memoryResponse.content,
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
