import { Agent, AgentDocument } from '../models/Agent'
import { Deployment } from '../models/Deployment'
import { ModelV2 } from '../models/v2/ModelV2'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import AgentRepository from '../repositories/AgentRepository'
import { generateBlurhash } from '../utils/blurhash'
import {
  AgentGetArguments,
  AgentsCreateArguments,
  AgentsDeleteArguments,
  AgentsDeployArguments,
  AgentsDeployResponse,
  AgentsStopDeploymentArguments,
  AgentsStopDeploymentResponse,
  AgentsUpdateArguments,
  FeatureFlag,
} from '@edenlabs/eden-sdk'
import { ObjectId } from '@fastify/mongodb'
import axios from 'axios'
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
    return reply.status(404).send({ error: 'Agent not found' })
  }

  const currentUserId = request.user ? request.user.userId : undefined
  const isOwnAgent =
    currentUserId && agent.owner.toString() === currentUserId.toString()

  const agentRepository = new AgentRepository(Agent)

  await Promise.all([
    agentRepository.model.populate(agent, {
      path: 'owner',
      select: '_id userId username userImage',
    }),
    isOwnAgent && agent.deployments && agent.deployments.length > 0
      ? agentRepository.model.populate(agent, {
          path: 'deployments',
          select: '_id platform',
          model: Deployment,
        })
      : Promise.resolve(),
  ])

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
    persona,
    greeting,
    suggestions,
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
    persona,
    greeting,
    suggestions,
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

export const getAgentDeployments = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const currentUserId = request.user.userId
  const agent = await Agent.findById(agentId)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (agent.owner.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to view deployments for this agent',
    })
  }

  const deploymentsFromDb = await Deployment.find({
    agent: agentId,
  })

  const discordDeployment = deploymentsFromDb.find(
    deployment => deployment.platform === 'discord',
  )
  const telegramDeployment = deploymentsFromDb.find(
    deployment => deployment.platform === 'telegram',
  )
  const farcasterDeployment = deploymentsFromDb.find(
    deployment => deployment.platform === 'farcaster',
  )

  const deployments = {
    discord: discordDeployment
      ? {
          deployment: discordDeployment,
          allowedChannels: agent.discordChannelAllowlist,
        }
      : undefined,
    telegram: telegramDeployment
      ? {
          deployment: telegramDeployment,
          allowedTopics: agent.telegramTopicAllowlist,
        }
      : undefined,
    farcaster: farcasterDeployment
      ? {
          deployment: farcasterDeployment,
        }
      : undefined,
  }

  return reply.status(200).send({
    deployments,
  })
}

export const deployAgent = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { agentId } = request.params as AgentsDeployArguments
  const { platform, secrets, config } = request.body as AgentsDeployArguments

  const agent = await Agent.findById(agentId)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (agent.owner.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to deploy this agent',
    })
  }

  try {
    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/deployments/create`,
      data: {
        agent: agentId,
        user: currentUserId,
        platform,
        secrets,
        config,
      },
    }

    const modalResponse = await axios.post(
      modalRequest.endpoint,
      modalRequest.data,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    const deployment = modalResponse.data as AgentsDeployResponse

    return reply.status(200).send({
      deploymentId: deployment.deployment_id,
    })
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      error: 'An error occurred while deploying the agent',
    })
  }
}

export const deleteAgentDeployment = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { agentId, platform } = request.params as AgentsStopDeploymentArguments

  const agent = await Agent.findById(agentId)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (agent.owner.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to stop this deployment',
    })
  }

  try {
    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/deployments/delete`,
      data: {
        agent: agentId,
        platform,
      },
    }

    const modalResponse = await axios.post(
      modalRequest.endpoint,
      modalRequest.data,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    const response = modalResponse.data as AgentsStopDeploymentResponse

    return reply.status(200).send({
      success: response.success,
    })
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      error: 'An error occurred while stopping the deployment',
    })
  }
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
