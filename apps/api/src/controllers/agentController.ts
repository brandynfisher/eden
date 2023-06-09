import {
  AgentsCreateArguments,
  AgentsDeleteArguments,
  AgentsGetArguments,
  AgentsListArguments,
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
  const { name, capabilites } = request.body as AgentsCreateArguments

  const input = {
    user: userId,
    name,
    capabilites,
  }

  const agentRepository = new AgentRepository(Agent)
  const agent = await agentRepository.create(input)

  return reply.status(200).send({
    agentId: agent._id,
  })
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
  const agents = await agentRepository.query(
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

  return reply.status(200).send(agents)
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
    capabilites: agent.capabilites,
  }

  return reply.status(200).send({ agent: response })
}
