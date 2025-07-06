import { Agent, AgentDocument } from '../models/Agent'
import { Deployment } from '../models/Deployment'
import { Trigger } from '../models/Trigger'
import { User } from '../models/User'
import { LikeV2 } from '../models/v2/LikeV2'
import { ModelV2 } from '../models/v2/ModelV2'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import AgentRepository from '../repositories/AgentRepository'
import { generateBlurhash } from '../utils/blurhash'
import { createIdOrSlugQuery, createMultiFieldQuery } from '../utils/mongoUtils'
import {
  AgentGetArguments,
  AgentsCreateArguments,
  AgentsCreateTriggerArguments,
  AgentsCreateTriggerResponse,
  AgentsDeleteArguments,
  AgentsDeleteTriggerResponse,
  AgentsDeployArguments,
  AgentsDeployResponse,
  AgentsStopDeploymentArguments,
  AgentsStopDeploymentResponse,
  AgentsUpdateArguments,
  AgentsUpdateDeploymentArguments,
  FeatureFlag,
  SubscriptionTier,
} from '@edenlabs/eden-sdk'
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
  const query = createIdOrSlugQuery(agentId)
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
    isOwnAgent && agent.agent_extras?.permissions?.editors
      ? agentRepository.model.populate(agent, {
          path: 'agent_extras.permissions.editors',
          select: '_id userId username userImage',
        })
      : Promise.resolve(),
  ])

  if (agent.userImage) {
    agent.userImage = forceCloudfrontUrl(server, agent.userImage)
  }

  if (agent.owner.userImage) {
    agent.owner.userImage = forceCloudfrontUrl(server, agent.owner.userImage)
  }

  // Check if user has liked this agent
  if (currentUserId) {
    const userLike = await LikeV2.findOne({
      user: currentUserId,
      entityType: 'agent',
      entityId: agent._id,
    })
    agent.isLiked = !!userLike
  }

  return reply.status(200).send({ agent })
}

export const createAgent = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const {
    name,
    key,
    description,
    image,
    models,
    persona,
    isPersonaPublic,
    greeting,
    knowledge,
    suggestions,
    voice,
    tools,
  } = request.body as AgentsCreateArguments

  const currentUserId = request.user.userId

  if (models && models.length > 10) {
    return reply.status(422).send({
      error: 'Cannot have more than 10 models',
    })
  }

  // Verify access to all models if provided
  if (models && models.length > 0) {
    for (const model of models) {
      await verifyModelAccess(reply, model.lora, currentUserId.toString())
    }
  }

  const imageFilename = image.split('/').pop()

  const agent = new Agent({
    type: 'agent',
    owner: currentUserId,
    username: key,
    name: name,
    userImage: imageFilename,
    description,
    persona,
    isPersonaPublic,
    greeting,
    knowledge,
    suggestions,
    voice,
    models: models || [],
    tools,
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
    isPersonaPublic,
    greeting,
    knowledge,
    suggestions,
    image,
    voice,
    models,
    public: isPublic,
    owner_pays,
    tools,
    agent_extras,
  } = request.body as AgentsUpdateArguments

  if (models && models.length > 10) {
    return reply.status(422).send({
      error: 'Cannot have more than 10 models',
    })
  }

  if (!agentId) {
    return reply.status(422).send({
      error: 'Missing agentId',
    })
  }

  if (isPublic === false) {
    const user = request.user
    if (user.subscriptionTier === SubscriptionTier.Free) {
      return reply.status(401).send({
        error: 'You are not authorized to make an agent private',
      })
    }
  }

  const query = createIdOrSlugQuery(agentId)

  const updateData: UpdateQuery<AgentDocument> = {
    username: key,
    name: name,
    description,
    persona,
    isPersonaPublic,
    greeting,
    knowledge,
    suggestions,
    voice,
    public: isPublic,
    owner_pays,
    tools,
  }

  // Handle models array
  if (!models || models.length === 0) {
    updateData.$unset = { models: 1 }
  } else {
    // Verify access to all models
    for (const model of models) {
      await verifyModelAccess(reply, model.lora, currentUserId.toString())
    }
    updateData.models = models
  }

  // Handle agent_extras (only owner can modify permissions)
  if (agent_extras) {
    if (agent_extras.permissions) {
      // First check that the agent exists and user is the owner
      const agentToUpdate = await Agent.findById(agentId)
      if (!agentToUpdate) {
        return reply.status(404).send({
          error: 'Agent not found',
        })
      }

      if (agentToUpdate.owner.toString() !== currentUserId.toString()) {
        return reply.status(401).send({
          error: 'Only the agent owner can modify permissions',
        })
      }

      if (agent_extras.permissions.editors) {
        // Validate and convert usernames to user IDs
        const editorIds = []
        for (const usernameOrId of agent_extras.permissions.editors) {
          const query = createMultiFieldQuery(usernameOrId, [
            'userId',
            'username',
          ])
          const user = await User.findOne(query)
          if (!user) {
            return reply.status(404).send({
              error: `User not found: ${usernameOrId}`,
            })
          }
          editorIds.push(user._id)
        }
        updateData['agent_extras.permissions.editors'] = editorIds
      }
    }
  }

  if (!image || image === '') {
    updateData.userImage = null
    updateData.blurhash = null
  } else if (image.startsWith('http')) {
    // This is a new uploaded image URL - process it
    const blurhash = await generateBlurhash(server, image)
    const imageFilename = image.split('/').pop()

    updateData.userImage = imageFilename
    updateData.blurhash = blurhash
  }
  // If image is just a filename (existing image), don't update image fields

  let result: UpdateResult
  // Check if user is owner or editor
  const agentToCheck = await Agent.findOne({
    ...query,
    deleted: false,
  })

  if (!agentToCheck) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  const isOwner = agentToCheck.owner.toString() === currentUserId.toString()
  const isEditor = agentToCheck.agent_extras?.permissions?.editors?.some(
    editor => editor.toString() === currentUserId.toString(),
  )

  if (!isOwner && !isEditor) {
    return reply.status(401).send({
      error: 'You are not authorized to update this agent',
    })
  }

  try {
    result = await Agent.updateOne(
      {
        ...query,
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

export const getAgentTriggers = async (
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
      error: 'User not authorized to view triggers for this agent',
    })
  }

  const triggers = await Trigger.find({
    agent: agentId,
    $or: [{ deleted: { $exists: false } }, { deleted: false }],
  })

  return reply.status(200).send({
    triggers,
  })
}

export const createAgentTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const {
    agentId,
    instruction,
    session_type,
    session,
    schedule,
    posting_instructions,
  } = request.body as AgentsCreateTriggerArguments
  const currentUserId = request.user.userId

  const agent = await Agent.findById(agentId)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (agent.owner.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to create triggers for this agent',
    })
  }

  const updateData = {
    agent: agentId,
    user: currentUserId,
    instruction,
    session_type,
    session,
    schedule,
    posting_instructions,
  }

  const edenComputeRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/triggers/create`,
    data: updateData,
  }

  const edenComputeResponse = await axios.post(
    edenComputeRequest.endpoint,
    edenComputeRequest.data,
    {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    },
  )

  const response = edenComputeResponse.data as AgentsCreateTriggerResponse

  return reply.status(200).send({
    triggerId: response.trigger_id,
  })
}

export const updateAgentTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId, triggerId } = request.params as {
    agentId: string
    triggerId: string
  }
  const {
    instruction,
    session_type,
    session,
    schedule,
    status,
    posting_instructions,
  } = request.body as {
    instruction?: string
    session_type?: 'new' | 'another'
    session?: string | null
    schedule?: any
    status?: 'active' | 'paused' | 'finished'
    posting_instructions?: any
  }
  const currentUserId = request.user.userId

  const agent = await Agent.findById(agentId)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (agent.owner.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to update triggers for this agent',
    })
  }

  const updateData = {
    id: triggerId,
    instruction,
    session_type,
    session,
    schedule,
    status,
    posting_instructions,
  }

  const edenComputeRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/triggers/update`,
    data: updateData,
  }

  const edenComputeResponse = await axios.post(
    edenComputeRequest.endpoint,
    edenComputeRequest.data,
    {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    },
  )

  const response = edenComputeResponse.data

  return reply.status(200).send({
    trigger: response.trigger || response,
  })
}

export const deleteAgentTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId, triggerId } = request.params as {
    agentId: string
    triggerId: string
  }
  const currentUserId = request.user.userId

  const agent = await Agent.findById(agentId)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (agent.owner.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to delete triggers for this agent',
    })
  }

  const edenComputeRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/triggers/delete`,
    data: { id: triggerId },
  }

  const edenComputeResponse = await axios.post(
    edenComputeRequest.endpoint,
    edenComputeRequest.data,
    {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    },
  )

  const response = edenComputeResponse.data as AgentsDeleteTriggerResponse

  return reply.status(200).send({
    success: response.success,
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

  const deployments = await Deployment.find({
    agent: agentId,
  })

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

  if (!request.user.featureFlags.includes(FeatureFlag.FeatureDeployments)) {
    return reply.status(401).send({
      error: 'You are not authorized to use this feature.',
    })
  }

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
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/create`,
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
  } catch (error: any) {
    console.error(error)
    console.log(error.response?.data)
    return reply.status(500).send({
      error:
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        'An error occurred while deploying the agent',
    })
  }
}

export const updateAgentDeployment = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId
  const { agentId } = request.params as AgentsUpdateDeploymentArguments
  const { platform, config } = request.body as AgentsUpdateDeploymentArguments

  const agent = await Agent.findById(agentId)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (agent.owner.toString() !== currentUserId.toString()) {
    return reply.status(401).send({
      error: 'User not authorized to update this deployment',
    })
  }

  const deployment = await Deployment.findOne({
    agent: agentId,
    platform,
  })

  if (!deployment) {
    return reply.status(404).send({
      error: 'Deployment not found',
    })
  }

  if (deployment.agent.toString() !== agentId) {
    return reply.status(401).send({
      error: 'User not authorized to update this deployment',
    })
  }

  try {
    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/update`,
      data: {
        deployment_id: deployment._id,
        config,
      },
    }

    await axios.post(modalRequest.endpoint, modalRequest.data, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    })

    return reply.status(200).send({
      deploymentId: deployment._id,
    })
  } catch (error) {
    console.error(error)
    return reply.status(500).send({
      error: 'An error occurred while updating the deployment',
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

  // Find the deployment to get its ID for the v2 API
  const deployment = await Deployment.findOne({
    agent: agentId,
    platform,
  })

  if (!deployment) {
    return reply.status(404).send({
      error: 'Deployment not found',
    })
  }

  try {
    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/delete`,
      data: {
        deployment_id: deployment._id,
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

export const likeAgent = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { agentId } = request.params as { agentId: string }

  if (!agentId) {
    return reply.status(422).send({
      message: 'Agent ID is required',
    })
  }

  try {
    // Check if the agent exists and user has access to it
    const agent = await Agent.findOne({
      _id: agentId,
      deleted: false,
      $or: [{ public: true }, { owner: userId }],
    })

    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found or you do not have access to it',
      })
    }

    // Check if user has already liked this agent
    const existingLike = await LikeV2.findOne({
      user: userId,
      entityType: 'agent',
      entityId: agentId,
    })

    if (existingLike) {
      return reply.status(400).send({
        message: 'Agent already liked by user',
      })
    }

    // Create the like
    await LikeV2.create({
      user: userId,
      entityType: 'agent',
      entityId: agentId,
    })

    // Increment the like count
    await Agent.findByIdAndUpdate(agentId, {
      $inc: { likeCount: 1 },
    })

    return reply.status(200).send({
      message: 'Agent liked successfully',
    })
  } catch (error) {
    console.error('Error liking agent:', error)
    return reply.status(500).send({
      message: 'Error liking agent',
    })
  }
}

export const unlikeAgent = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { agentId } = request.params as { agentId: string }

  if (!agentId) {
    return reply.status(422).send({
      message: 'Agent ID is required',
    })
  }

  try {
    // Check if the agent exists and user has access to it
    const agent = await Agent.findOne({
      _id: agentId,
      deleted: false,
      $or: [{ public: true }, { owner: userId }],
    })

    if (!agent) {
      return reply.status(404).send({
        message: 'Agent not found or you do not have access to it',
      })
    }

    // Check if the like exists
    const like = await LikeV2.findOne({
      user: userId,
      entityType: 'agent',
      entityId: agentId,
    })

    if (!like) {
      return reply.status(404).send({
        message: 'Like not found',
      })
    }

    // Delete the like
    await LikeV2.findByIdAndDelete(like._id)

    // Decrement the like count
    if (agent.likeCount && agent.likeCount > 0) {
      await Agent.findByIdAndUpdate(agentId, {
        $inc: { likeCount: -1 },
      })
    }

    return reply.status(200).send({
      message: 'Agent unliked successfully',
    })
  } catch (error) {
    console.error('Error unliking agent:', error)
    return reply.status(500).send({
      message: 'Error unliking agent',
    })
  }
}
