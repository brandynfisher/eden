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
 * Builds a comprehensive prompt for the voice agent based on agent context
 * This combines description, persona, user memory, and collective knowledge
 * into a single prompt that can be passed to voice providers
 */
export function buildAgentPrompt(
  agentContext: AgentContext,
  agentData: AgentData,
): string {
  const parts: string[] = []

  // Agent name
  if (agentData.name) {
    parts.push(`You are ${agentData.name}.`)
  }

  // Description
  if (agentContext.description) {
    parts.push(`\nDescription: ${agentContext.description}`)
  }

  // Persona
  if (agentContext.persona) {
    parts.push(`\nPersona: ${agentContext.persona}`)
  }

  // User Memory
  if (agentContext.memory.userMemory) {
    parts.push(`\nUser Memory: ${agentContext.memory.userMemory}`)
  }

  // Collective Knowledge
  if (
    agentContext.memory.collectiveMemory &&
    agentContext.memory.collectiveMemory.length > 0
  ) {
    parts.push('\nCollective Knowledge:')
    agentContext.memory.collectiveMemory.forEach(shard => {
      parts.push(`\n${shard.shard_name}: ${shard.content}`)
    })
  }

  return parts.join('\n').trim()
}
