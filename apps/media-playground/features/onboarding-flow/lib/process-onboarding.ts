import { OnboardingState } from '../types'

interface AgentPromptsExtractionResponse {
  agent_instructions: string
  agent_description: string
  memory_instructions: string
  cost: number
}

interface AgentArgs {
  agentInstructions: string
  agentDescription: string
  memoryInstructions: string
}

/**
 * Extract agent prompts from a conversation session.
 *
 * This calls the backend which:
 * 1. Fetches all messages from the session
 * 2. Uses LLM to extract persona, description, and memory instructions
 * 3. Returns the extracted data
 * 4. Stores the data in Zustand state
 *
 * Note: user_id is automatically extracted from the auth token by the backend
 */
export async function processOnboardingLLMCalls(
  sessionId: string,
  getState: () => OnboardingState,
): Promise<AgentArgs> {
  // Get agent name from Zustand store to pass to LLM
  const state = getState()
  const agentName = state.name || '<agent-name>'

  const response = await fetch(`/api/agent_creation/extract_prompts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      agent_name: agentName,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Agent prompts extraction failed: ${response.statusText} - ${errorText}`,
    )
  }

  const data: AgentPromptsExtractionResponse = await response.json()

  const agentArgs: AgentArgs = {
    agentInstructions: data.agent_instructions,
    agentDescription: data.agent_description,
    memoryInstructions: data.memory_instructions,
  }

  // Store the extracted data in Zustand
  const store = getState()
  store.setAgentInstructions(data.agent_instructions)
  store.setAgentDescription(data.agent_description)
  store.setMemoryInstructions(data.memory_instructions)

  return agentArgs
}

/**
 * Creates a new agent in the database using the full onboarding state
 *
 * This will call the agent creation API endpoint with all the collected data:
 * - name, username, profileImageUrl, referenceImages
 * - agentInstructions, agentDescription, memoryInstructions
 */
export async function createAgentFromOnboardingState(
  getState: () => OnboardingState,
): Promise<string> {
  const state = getState()

  // Validate required fields
  if (!state.name || !state.username) {
    throw new Error('Missing required fields: name and username are required')
  }

  if (!state.agentInstructions || !state.agentDescription) {
    throw new Error(
      'Missing LLM-extracted fields: agentInstructions and agentDescription are required. Ensure processOnboardingLLMCalls completed successfully.',
    )
  }

  const response = await fetch('/api/agents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: state.name,
      key: state.username,
      description: state.agentDescription,
      image: state.profileImageUrl,
      persona: state.agentInstructions,
      public: true,
      owner_pays: 'deployments',
      tools: {
        create_image: true,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Agent creation failed: ${response.statusText} - ${errorText}`,
    )
  }

  const data = await response.json()
  const agentId = data.agentId

  // Create collective memory with memory_instructions if they exist
  if (state.memoryInstructions) {
    try {
      // Truncate memory instructions to 3000 chars max, pad to 300 chars min
      let truncatedMemoryInstructions = state.memoryInstructions.slice(0, 3000)
      if (truncatedMemoryInstructions.length < 300) {
        truncatedMemoryInstructions = truncatedMemoryInstructions.padEnd(
          300,
          ' ',
        )
      }

      const collectiveMemoryResponse = await fetch(
        `/api/agents/${agentId}/collective-memory`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shard_name: 'Collective Memory',
            extraction_prompt: truncatedMemoryInstructions,
          }),
        },
      )

      if (!collectiveMemoryResponse.ok) {
        // Don't throw - agent was created successfully, collective memory is supplementary
      }
    } catch (error) {
      // Don't throw - agent was created successfully, collective memory is supplementary
    }
  }

  // Create a concept with reference images if they exist
  if (state.referenceImages && state.referenceImages.length > 0) {
    try {
      const conceptResponse = await fetch('/api/v2/concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Visual Knowledge',
          agent: agentId,
          usage_instructions:
            'Use these images as reference images whenever relevant in the context',
          images: state.referenceImages.map(ref => ({
            image: ref.imageUrl,
            usage_instructions: ref.description,
          })),
        }),
      })

      if (!conceptResponse.ok) {
        // Don't throw - agent was created successfully, concept creation is supplementary
      }
    } catch (error) {
      // Don't throw - agent was created successfully, concept creation is supplementary
    }
  }

  return agentId
}
