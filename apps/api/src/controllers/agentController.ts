import { Agent, AgentDocument } from '../models/Agent'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import AgentRepository from '../repositories/AgentRepository'
import { generateBlurhash } from '../utils/blurhash'
import {
  AgentGetArguments,
  AgentsCreateArguments,
  AgentsDeleteArguments,
  AgentsUpdateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { UpdateResult } from 'mongodb'
import { UpdateQuery } from 'mongoose'

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
    currentUserId && agent.user.toString() === currentUserId.toString()

  if (!isOwnAgent && !agent.public) {
    return reply.status(401).send({
      error: 'User not authorized to view this agent',
    })
  }

  await agentRepository.model.populate(agent, {
    path: 'user',
    select: '_id userId username userImage',
  })

  agent.image = forceCloudfrontUrl(server, agent.image)

  return reply.status(200).send({ agent })
}

export const createAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { name, key, description, image, instructions, tools, discordId } =
    request.body as AgentsCreateArguments

  const currentUserId = request.user.userId

  const blurhash = await generateBlurhash(server, image)

  const imageFilename = image.split('/').pop()

  const agent = new Agent({
    user: currentUserId,
    name,
    key,
    image: imageFilename,
    blurhash,
    description,
    instructions,
    tools,
    discordId,
  })

  try {
    await agent.save()
  } catch (error) {
    // @ts-ignore
    if (error.code === 11000) {
      return reply.status(409).send({
        error: 'An agent with this key already exists',
      })
    }

    return reply.status(500).send({
      error: 'An error occurred while creating the agent',
    })
  }

  return reply.status(200).send({ agentId: agent._id })
}

export const updateAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const { agentId } = request.params as AgentsUpdateArguments
  const {
    name,
    key,
    description,
    image,
    instructions,
    tools,
    discordId,
    public: isPublic,
  } = request.body as AgentsUpdateArguments

  if (!agentId) {
    return reply.status(422).send({
      error: 'Missing agentId',
    })
  }

  const updateData: UpdateQuery<AgentDocument> = {
    name,
    key,
    description,
    instructions,
    tools,
    discordId,
    public: isPublic,
  }

  if (image) {
    const blurhash = await generateBlurhash(server, image)
    const imageFilename = image.split('/').pop()

    updateData.image = imageFilename
    updateData.blurhash = blurhash
  }

  let result: UpdateResult
  try {
    result = await Agent.updateOne(
      {
        _id: agentId,
        user: currentUserId,
        deleted: false,
      },
      updateData,
    )
  } catch (error) {
    // @ts-ignore
    if (error.code === 11000) {
      return reply.status(409).send({
        error: 'An agent with this key already exists',
      })
    }

    return reply.status(500).send({
      error: 'An error occurred while updating the agent',
    })
  }

  if (!result.matchedCount) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  return reply.status(200).send({
    agentId,
  })
}

export const deleteAgent = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  const { agentId } = request.params as AgentsDeleteArguments

  const agent = await Agent.findOne({
    _id: agentId,
  })

  if (!agent || agent.deleted) {
    return reply.status(404).send({
      message: 'Agent not found',
    })
  }

  if (agent.user.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      message: 'User not authorized to delete this',
    })
  }

  await agent.delete()

  return reply.status(200).send()
}
