import { useOnboardingStore } from '../chat/store'

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
): Promise<AgentArgs> {
  console.log(`[processOnboardingLLMCalls] Starting for session: ${sessionId}`)

  // Get agent name from Zustand store to pass to LLM
  const state = useOnboardingStore.getState()
  const agentName = state.name || '<agent-name>'

  console.log('[processOnboardingLLMCalls] Full Zustand state:', state)
  console.log('[processOnboardingLLMCalls] Agent name from store:', agentName)

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
    console.error(
      '[processOnboardingLLMCalls] Error response:',
      response.status,
      response.statusText,
    )
    console.error('[processOnboardingLLMCalls] Error body:', errorText)

    try {
      const errorJson = JSON.parse(errorText)
      console.error('[processOnboardingLLMCalls] Error JSON:', errorJson)
    } catch (e) {
      // Not JSON, already logged as text
    }

    throw new Error(`Agent prompts extraction failed: ${response.statusText}`)
  }

  const data: AgentPromptsExtractionResponse = await response.json()
  console.log('[processOnboardingLLMCalls] Received data:', data)

  console.log('[processOnboardingLLMCalls] Extraction completed:')
  console.log(`  - Cost: ${data.cost} manna`)
  console.log(
    `  - Agent instructions length: ${data.agent_instructions.length} chars`,
  )
  console.log(
    `  - Agent description length: ${data.agent_description.length} chars`,
  )
  console.log(
    `  - Memory instructions length: ${data.memory_instructions.length} chars`,
  )

  const agentArgs: AgentArgs = {
    agentInstructions: data.agent_instructions,
    agentDescription: data.agent_description,
    memoryInstructions: data.memory_instructions,
  }

  // Store the extracted data in Zustand
  const store = useOnboardingStore.getState()
  store.setAgentInstructions(data.agent_instructions)
  store.setAgentDescription(data.agent_description)
  store.setMemoryInstructions(data.memory_instructions)

  console.log(
    '[processOnboardingLLMCalls] Agent args stored in Zustand:',
    agentArgs,
  )

  return agentArgs
}

/**
 * Creates a new agent in the database using the full onboarding state
 *
 * This will call the agent creation API endpoint with all the collected data:
 * - name, username, profileImageUrl, referenceImages
 * - agentInstructions, agentDescription, memoryInstructions
 */
export async function createAgentFromOnboardingState(): Promise<string> {
  const state = useOnboardingStore.getState()

  console.log('[createAgentFromOnboardingState] Creating agent with state:', {
    name: state.name,
    username: state.username,
    profileImageUrl: state.profileImageUrl,
    referenceImages: state.referenceImages,
    agentInstructions: state.agentInstructions,
    agentDescription: state.agentDescription,
    memoryInstructions: state.memoryInstructions,
  })

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
    console.error(
      '[createAgentFromOnboardingState] Error:',
      response.status,
      errorText,
    )
    throw new Error(`Agent creation failed: ${response.statusText}`)
  }

  const data = await response.json()
  const agentId = data.agentId

  console.log(
    '[createAgentFromOnboardingState] Agent created successfully:',
    agentId,
  )

  // Create collective memory with memory_instructions if they exist
  if (state.memoryInstructions) {
    console.log(
      '[createAgentFromOnboardingState] Creating Collective Memory with memory instructions',
    )

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
        const errorText = await collectiveMemoryResponse.text()
        console.error(
          '[createAgentFromOnboardingState] Collective memory creation error:',
          collectiveMemoryResponse.status,
          errorText,
        )
        // Don't throw - agent was created successfully, collective memory is supplementary
      } else {
        const collectiveMemoryData = await collectiveMemoryResponse.json()
        console.log(
          '[createAgentFromOnboardingState] Collective Memory created successfully:',
          collectiveMemoryData,
        )
      }
    } catch (error) {
      console.error(
        '[createAgentFromOnboardingState] Failed to create collective memory:',
        error,
      )
      // Don't throw - agent was created successfully, collective memory is supplementary
    }
  }

  // Create a concept with reference images if they exist
  if (state.referenceImages && state.referenceImages.length > 0) {
    console.log(
      '[createAgentFromOnboardingState] Creating Visual Knowledge concept with',
      state.referenceImages.length,
      'reference images',
    )

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
        const errorText = await conceptResponse.text()
        console.error(
          '[createAgentFromOnboardingState] Concept creation error:',
          conceptResponse.status,
          errorText,
        )
        // Don't throw - agent was created successfully, concept creation is supplementary
      } else {
        const conceptData = await conceptResponse.json()
        console.log(
          '[createAgentFromOnboardingState] Visual Knowledge concept created:',
          conceptData.concept?._id,
        )
      }
    } catch (error) {
      console.error(
        '[createAgentFromOnboardingState] Failed to create concept:',
        error,
      )
      // Don't throw - agent was created successfully, concept creation is supplementary
    }
  }

  return agentId
}
