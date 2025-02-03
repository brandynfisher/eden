import { Agent, AgentDocument } from '../models/Agent'
import { ModelV2 } from '../models/v2/ModelV2'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import { generateBlurhash } from '../utils/blurhash'
import {
  AgentGetArguments,
  AgentsCreateArguments,
  AgentsDeleteArguments,
  AgentsUpdateArguments,
  FeatureFlag,
} from '@edenlabs/eden-sdk'
import { ObjectId } from '@fastify/mongodb'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { UpdateResult } from 'mongodb'
import { UpdateQuery } from 'mongoose'

export const getAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as AgentGetArguments
  const isObjectId = ObjectId.isValid(agentId)
  const query = isObjectId
    ? { _id: new ObjectId(agentId) }
    : { username: agentId }
  const agent = await Agent.findOne(query)

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

  const populateFields = [
    {
      path: 'owner',
      select: '_id userId username userImage',
    },
  ]

  if (agent.deployments?.length > 0) {
    populateFields.push({
      path: 'deployments',
      select: 'platform',
    })
  }

  await Agent.populate(agent, populateFields)

  if (agent.userImage) {
    agent.userImage = forceCloudfrontUrl(server, agent.userImage)
  }

  return reply.status(200).send({ agent })
}

export const createAgent = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { name, key, description, image, modelId } =
    request.body as AgentsCreateArguments

  const currentUserId = request.user.userId

  if (modelId) {
    await verifyModelAccess(reply, modelId, currentUserId.toString())
  }

  const imageFilename = image.split('/').pop()

  const agent = new Agent({
    type: 'agent',
    owner: currentUserId,
    username: key,
    name: name,
    userImage: imageFilename,
    description,
    model: modelId || undefined,
    featureFlags: [FeatureFlag.FreeTools],
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
    modelId,
    public: isPublic,
  } = request.body as AgentsUpdateArguments

  if (!agentId) {
    return reply.status(422).send({
      error: 'Missing agentId',
    })
  }

  const updateData: UpdateQuery<AgentDocument> = {
    username: key,
    name: name,
    description,
    public: isPublic,
  }

  if (!modelId) {
    updateData.$unset = { model: 1 }
  } else if (modelId) {
    await verifyModelAccess(reply, modelId, currentUserId.toString())
    updateData.model = modelId
  }

  if (image) {
    const blurhash = await generateBlurhash(server, image)
    const imageFilename = image.split('/').pop()

    updateData.userImage = imageFilename
    updateData.blurhash = blurhash
  }

  let result: UpdateResult
  try {
    result = await Agent.updateOne(
      {
        _id: agentId,
        owner: currentUserId,
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

export const updateAgentDeployment = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { agentId } = request.params as { agentId: string }
  const deploymentData = request.body as {
    discord: {
      enabled: boolean
      config?: {
        token: string
        allowedChannels: Array<{ id: string; note?: string }>
      }
    }
    telegram: {
      enabled: boolean
      config?: {
        token: string
        allowedChannels: Array<{ id: string; note?: string }>
      }
    }
    farcaster: {
      enabled: boolean
      config?: {
        token: string
        allowedChannels: Array<{ id: string; note?: string }>
      }
    }
  }

  if (!agentId) {
    return reply.status(422).send({
      error: 'Missing agentId',
    })
  }

  // TODO: Implement eve api calls
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

  if (agent.owner.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      message: 'User not authorized to delete this',
    })
  }

  await agent.delete()

  return reply.status(200).send()
}

const verifyModelAccess = async (
  reply: FastifyReply,
  modelId: string,
  currentUserId: string,
) => {
  const model = await ModelV2.findById(modelId)

  if (!model || model.deleted) {
    return reply.status(404).send({
      error: 'Model not found',
    })
  }

  const isOwnModel = model.user.toString() === currentUserId.toString()
  if (!isOwnModel && !model.public) {
    return reply.status(401).send({
      error: 'You are not authorized to use this model',
    })
  }
}
