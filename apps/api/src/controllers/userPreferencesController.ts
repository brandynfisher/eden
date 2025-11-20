import { UserPreferences } from '../models/UserPreferences'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const getUserPreferences = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}

  if (!userId) {
    return reply.status(401).send({
      message: 'Unauthorized',
    })
  }

  try {
    const preferences = await UserPreferences.findOne({ user: userId })
      .populate({
        path: 'last_agents',
        select: 'username userImage name _id type owner',
        match: { type: 'agent', deleted: { $ne: true } },
        options: { limit: 5 },
      })
      .populate({
        path: 'pinned_agents',
        select: 'username userImage name _id type owner',
        match: { type: 'agent', deleted: { $ne: true } },
      })
      .lean()

    if (!preferences) {
      return reply.status(200).send({
        last_agents: [],
        pinned_agents: [],
        hidden_agents: [],
      })
    }

    // Filter out any null entries (in case some agents were deleted)
    const validAgents = (preferences.last_agents || []).filter(
      (agent: any) => agent !== null,
    )

    const validPinnedAgents = (preferences.pinned_agents || []).filter(
      (agent: any) => agent !== null,
    )

    // Only return the top 5 agents
    const topAgents = validAgents.slice(0, 5)

    return reply.status(200).send({
      last_agents: topAgents,
      pinned_agents: validPinnedAgents,
      hidden_agents: preferences.hidden_agents || [],
    })
  } catch (e) {
    console.error('Error fetching user preferences:', e)
    return reply.status(500).send({
      message: 'Failed to fetch user preferences',
    })
  }
}
