import {
  AgentsCreateArguments,
  AgentsDeleteArguments,
  AgentsGetArguments,
  AgentsListArguments,
  AgentsUpdateArguments,
} from '@eden-labs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { Agent } from '../models/Agent'
import { User } from '../models/Creator'
import AgentRepository from '../repositories/AgentRepository'
import CreatorRepository from '../repositories/CreatorRepository'

export const createAgent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { name, capabilities } = request.body as AgentsCreateArguments

  const input = {
    user: userId,
    name,
    capabilities,
  }

  const agentRepository = new AgentRepository(Agent)
  const agent = await agentRepository.create(input)

  return reply.status(200).send({
    agentId: agent._id,
  })
}

export const updateAgent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { agentId, name, capabilities } = request.body as AgentsUpdateArguments

  if (!agentId) {
    return reply.status(400).send({
      message: 'You must provide an agentId',
    })
  }

  const agent = await Agent.findOne({
    agentId,
    user: userId,
  })

  if (!agent) {
    return reply.status(401).send({
      message: 'Agent not found',
    })
  }

  const input = {
    name,
    capabilities,
  }

  await agent.update(input)

  return reply.status(200).send({ agentId })
}

export const deleteAgent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { agentId } = request.body as AgentsDeleteArguments

  if (!agentId) {
    return reply.status(400).send({
      message: 'You must provide an agentId',
    })
  }

  const dbAgent = await Agent.findOne({
    agentId,
    user: userId,
  })

  if (!dbAgent) {
    return reply.status(401).send({
      message: 'Agent not found',
    })
  }

  await dbAgent.delete()

  return reply.status(200).send({})
}

export const listAgents = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort } = request.query as AgentsListArguments

  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId,
  })

  const agentRepository = new AgentRepository(Agent)
  const agentPaginatedResponse = await agentRepository.query(
    {
      user: creators.docs
        ? creators.docs.map(creator => creator._id)
        : undefined,
    },
    {
      limit,
      page,
      sort,
    },
  )
  const response = {
    ...agentPaginatedResponse,
    docs: agentPaginatedResponse.docs.map(agent => ({
      id: agent._id,
      name: agent.name,
      capabilities: agent.capabilities,
    })),
  }

  return reply.status(200).send(response)
}

export const getAgent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as AgentsGetArguments
  const agent = await Agent.findOne({ agentId })
  if (!agent) {
    return reply.status(404).send({
      message: 'Agent not found',
    })
  }

  const response = {
    id: agent._id,
    name: agent.name,
    capabilities: agent.capabilities,
  }

  return reply.status(200).send({ agent: response })
}
