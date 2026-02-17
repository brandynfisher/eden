import { Agent, AgentDocument } from '../models/Agent'
import {
  AgentPermission,
  AgentPermissionLevel,
} from '../models/AgentPermission'
import { AgentRealtime } from '../models/AgentRealtime'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const hasOwnerAccess = async (
  agent: AgentDocument,
  userId: string,
): Promise<boolean> => {
  if (agent.owner.toString() === userId) return true

  const permission = await AgentPermission.findOne({
    agent: agent._id,
    user: userId,
    level: AgentPermissionLevel.Owner,
  })
  return !!permission
}

interface Params {
  agentId: string
}

export const getAgentRealtimeSettings = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as Params
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const agent = await Agent.findById(agentId)
  if (!agent) {
    return reply.status(404).send({ message: 'Agent not found' })
  }

  // Any authenticated user can read realtime settings (needed for /realtime page)
  // Owner check is only required for updating settings

  const settings = await AgentRealtime.findOne({ agent: agentId })

  // Return settings if found, otherwise just the agent ID
  // Frontend merges with DEFAULT_REALTIME_SETTINGS from realtime-defaults.ts
  return reply.status(200).send({
    settings: settings || { agent: agentId },
  })
}

export const updateAgentRealtimeSettings = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as Params
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ message: 'Unauthorized' })
  }

  const agent = await Agent.findById(agentId)
  if (!agent) {
    return reply.status(404).send({ message: 'Agent not found' })
  }

  if (!(await hasOwnerAccess(agent, userId.toString()))) {
    return reply.status(403).send({ message: 'Forbidden' })
  }

  // Route schema validates the body - just pass through defined fields
  const body = request.body as Record<string, unknown>
  const definedEntries = Object.entries(body).filter(
    ([_, v]) => v !== undefined,
  )

  // Split into fields to set and fields to unset (null means remove)
  const setData: Record<string, unknown> = { agent: agentId }
  const unsetData: Record<string, 1> = {}

  for (const [key, value] of definedEntries) {
    if (value === null) {
      unsetData[key] = 1
    } else {
      setData[key] = value
    }
  }

  const updateOps: Record<string, unknown> = { $set: setData }
  if (Object.keys(unsetData).length > 0) {
    updateOps.$unset = unsetData
  }

  const settings = await AgentRealtime.findOneAndUpdate(
    { agent: agentId },
    updateOps,
    { upsert: true, new: true },
  )

  return reply.status(200).send({ settings })
}
