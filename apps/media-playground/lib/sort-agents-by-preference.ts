import { Agent } from '@edenlabs/eden-sdk'

/**
 * Sorts agents by user preference (last_agents) with fallback to message count
 * @param agents - Array of agents to sort
 * @param lastAgents - User's last_agents from preferences
 * @returns Sorted array of agents
 */
export function sortAgentsByPreference(
  agents: Agent[],
  lastAgents: Array<{ _id: string; username?: string }>,
): Agent[] {
  if (!agents || agents.length === 0) return []
  if (!lastAgents || lastAgents.length === 0) return agents

  // Create a map of last_agents for quick lookup (index = priority, lower is better)
  const lastAgentPriorityMap = new Map<string, number>()
  lastAgents.forEach((agent, index) => {
    lastAgentPriorityMap.set(agent._id, index)
    if (agent.username) {
      lastAgentPriorityMap.set(agent.username, index)
    }
  })

  // Separate agents into preferred and non-preferred
  const preferredAgents: Agent[] = []
  const nonPreferredAgents: Agent[] = []

  agents.forEach(agent => {
    const priority =
      lastAgentPriorityMap.get(agent._id) ??
      lastAgentPriorityMap.get(agent.username)

    if (priority !== undefined) {
      preferredAgents.push(agent)
    } else {
      nonPreferredAgents.push(agent)
    }
  })

  // Sort preferred agents by their priority in last_agents
  preferredAgents.sort((a, b) => {
    const priorityA =
      lastAgentPriorityMap.get(a._id) ??
      lastAgentPriorityMap.get(a.username) ??
      Infinity
    const priorityB =
      lastAgentPriorityMap.get(b._id) ??
      lastAgentPriorityMap.get(b.username) ??
      Infinity
    return priorityA - priorityB
  })

  // Sort non-preferred agents by message count (already sorted by the query usually)
  // Return preferred agents first, then non-preferred
  return [...preferredAgents, ...nonPreferredAgents]
}

/**
 * Filters and sorts agents for "My Agents" section
 * Shows last_agents owned by user first, then fills remaining slots with top agents by message count
 */
export function sortMyAgentsByPreference(
  agents: Agent[],
  lastAgents: Array<{ _id: string; username?: string }>,
  userId?: string,
  limit = 6,
): Agent[] {
  if (!userId) return agents.slice(0, limit)

  // Filter to only agents owned by the user
  const ownedAgents = agents.filter(
    agent => agent.owner === userId || agent.owner?._id === userId,
  )

  // Sort owned agents by preference
  const sorted = sortAgentsByPreference(ownedAgents, lastAgents)

  return sorted.slice(0, limit)
}

/**
 * Filters and sorts agents for "All Agents" section
 * Shows last_agents not owned by user first, then other agents by message count
 */
export function sortAllAgentsByPreference(
  agents: Agent[],
  lastAgents: Array<{ _id: string; username?: string }>,
): Agent[] {
  // Sort all agents by preference
  return sortAgentsByPreference(agents, lastAgents)
}
