import { Agent } from '../models/Agent'
import { s3ThumbnailUrl } from '../plugins/s3Plugin'
import AgentRepository from '../repositories/AgentRepository'
import { AgentGetArguments, AgentsCreateArguments } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const getAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as AgentGetArguments

  const agentRepository = new AgentRepository(Agent)
  const agent = await agentRepository.findById(agentId)

  if (!agent || agent.deleted) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  const currentUserId = request.user ? request.user.userId : undefined
  const isOwnAgent =
    currentUserId && agent.owner.toString() === currentUserId.toString()

  if (!isOwnAgent && !agent.public) {
    return reply.status(401).send({
      error: 'User not authorized to view this agent',
    })
  }

  await agentRepository.model.populate(agent, {
    path: 'user',
    select: '_id userId username userImage',
  })

  agent.image = s3ThumbnailUrl(server, agent.image || '', 1024)

  return reply.status(200).send({ agent })
}

export const createAgent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { name, key, description, image, instructions, tools, discordId } =
    request.body as AgentsCreateArguments

  const currentUserId = request.user.userId

  const agent = new Agent({
    owner: currentUserId,
    name,
    key,
    image,
    description,
    instructions,
    tools,
    discordId,
  })

  await agent.save()

  return reply.status(200).send({ agentId: agent._id })
}
