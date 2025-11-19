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
        select: 'username userImage _id type',
        match: { type: 'agent', deleted: { $ne: true } }, // Only populate agents that aren't deleted
        options: { limit: 3 }, // Only get top 3 agents
      })
      .lean()

    if (!preferences) {
      return reply.status(200).send({
        last_agents: [],
      })
    }

    // Filter out any null entries (in case some agents were deleted)
    const validAgents = (preferences.last_agents || []).filter(
      (agent: any) => agent !== null,
    )

    // Only return the top 3 agents
    const topAgents = validAgents.slice(0, 3)

    return reply.status(200).send({
      last_agents: topAgents,
    })
  } catch (e) {
    console.error('Error fetching user preferences:', e)
    return reply.status(500).send({
      message: 'Failed to fetch user preferences',
    })
  }
}
