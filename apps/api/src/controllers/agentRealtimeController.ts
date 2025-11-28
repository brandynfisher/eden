import { Agent, AgentDocument } from '../models/Agent'
import {
  AgentPermission,
  AgentPermissionLevel,
} from '../models/AgentPermission'
import { AgentRealtime } from '../models/AgentRealtime'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const DEFAULT_SETTINGS = {
  elevenlabs_agent_id: null,
  voice_id: null,
  language: 'en',
  first_message: null,
  llm_model: 'claude-sonnet-4-5',
  temperature: 0.7,
  max_tokens: 4096,
  tts_stability: 0.45,
  tts_speed: 1.0,
  tts_similarity_boost: 0.25,
  user_input_fields: [],
}

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

  return reply.status(200).send({
    settings: settings || { agent: agentId, ...DEFAULT_SETTINGS },
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
  const updateData = Object.fromEntries(
    Object.entries(body).filter(([_, v]) => v !== undefined),
  )

  const settings = await AgentRealtime.findOneAndUpdate(
    { agent: agentId },
    { $set: { ...updateData, agent: agentId } },
    { upsert: true, new: true },
  )

  return reply.status(200).send({ settings })
}
