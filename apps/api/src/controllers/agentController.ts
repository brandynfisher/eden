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

const calculateNextScheduledRun = (schedule: any): Date | null => {
  if (!schedule) return null
  
  const now = new Date()
  
  // For one-time tasks (start_date equals end_date)
  if (schedule.start_date && schedule.end_date) {
    const startDate = new Date(schedule.start_date)
    const endDate = new Date(schedule.end_date)
    
    if (startDate.getTime() === endDate.getTime()) {
      // One-time task
      return startDate > now ? startDate : null
    }
  }
  
  // For recurring tasks, calculate next run based on current time
  if (schedule.hour !== undefined && schedule.minute !== undefined) {
    const nextRun = new Date()
    nextRun.setHours(parseInt(schedule.hour.toString(), 10))
    nextRun.setMinutes(parseInt(schedule.minute.toString(), 10))
    nextRun.setSeconds(0)
    nextRun.setMilliseconds(0)
    
    // If the time today has passed, move to next occurrence based on schedule
    if (nextRun <= now) {
      if (schedule.day_of_week === '*') {
        // Daily - add 1 day
        nextRun.setDate(nextRun.getDate() + 1)
      } else if (schedule.day_of_week) {
        // Weekly - find next occurrence of the day
        const targetDay = parseInt(schedule.day_of_week.toString(), 10)
        const currentDay = nextRun.getDay()
        let daysUntilNext = targetDay - currentDay
        if (daysUntilNext <= 0) daysUntilNext += 7
        nextRun.setDate(nextRun.getDate() + daysUntilNext)
      } else if (schedule.month && schedule.day) {
        // Annually - find next occurrence
        const targetMonth = parseInt(schedule.month.toString(), 10) - 1 // 0-indexed
        const targetDay = parseInt(schedule.day.toString(), 10)
        nextRun.setMonth(targetMonth)
        nextRun.setDate(targetDay)
        if (nextRun <= now) {
          nextRun.setFullYear(nextRun.getFullYear() + 1)
        }
      } else if (schedule.day) {
        // Monthly - find next occurrence of the day
        const targetDay = parseInt(schedule.day.toString(), 10)
        nextRun.setDate(targetDay)
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1)
        }
      }
    }
    
    return nextRun
  }
  
  return null
}

export const updateAgentTrigger = async (
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

  // Find the trigger to update
  const trigger = await Trigger.findById(triggerId)

  if (!trigger) {
    return reply.status(404).send({
      error: 'Trigger not found',
    })
  }

  // Verify the trigger belongs to the agent
  if (trigger.agent.toString() !== agentId) {
    return reply.status(401).send({
      error: 'Trigger does not belong to this agent',
    })
  }

  // Validate schedule if provided
  if (schedule !== undefined) {
    const nextRun = calculateNextScheduledRun(schedule)
    if (nextRun) {
      const now = new Date()
      const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000)
      
      if (nextRun < twoMinutesFromNow) {
        return reply.status(400).send({
          error: 'Next scheduled run must be at least 2 minutes in the future',
        })
      }
    }
  }

  // Build update data - only include fields that are provided
  const updateData: any = {}

  if (instruction !== undefined) updateData.instruction = instruction
  if (session_type !== undefined) updateData.session_type = session_type
  if (session !== undefined) updateData.session = session
  if (schedule !== undefined) {
    updateData.schedule = schedule
    // Calculate and update next_scheduled_run when schedule is updated
    updateData.next_scheduled_run = calculateNextScheduledRun(schedule)
  }
  if (status !== undefined) updateData.status = status
  if (posting_instructions !== undefined)
    updateData.posting_instructions = posting_instructions

  // Update the trigger
  const updatedTrigger = await Trigger.findByIdAndUpdate(
    triggerId,
    updateData,
    { new: true },
  )

  return reply.status(200).send({
    trigger: updatedTrigger,
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

  if (!request.user.featureFlags.includes(FeatureFlag.Preview)) {
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

export const getAllUserTriggers = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  try {
    // Get all user's agents
    const agents = await Agent.find({
      owner: currentUserId,
      deleted: false,
    }).select('_id name username userImage')

    const agentIds = agents.map(agent => agent._id)

    if (agentIds.length === 0) {
      return reply.status(200).send({
        triggers: [],
      })
    }

    type TriggerWithAgent = typeof Trigger & {
      agent: {
        _id: string
        name: string
        username: string
        userImage: string
      }
    }

    // Get all triggers for user's agents
    const triggers = (await Trigger.find({
      agent: { $in: agentIds },
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
    }).populate({
      path: 'agent',
      select: '_id name username userImage',
      model: Agent,
    })) as TriggerWithAgent[]

    // Force cloudfront URLs for agent images
    triggers.forEach(trigger => {
      if (trigger.agent && trigger.agent.userImage) {
        trigger.agent.userImage = forceCloudfrontUrl(
          server,
          trigger.agent.userImage,
        )
      }
    })

    return reply.status(200).send({
      triggers,
    })
  } catch (error) {
    console.error('Error getting user triggers:', error)
    return reply.status(500).send({
      error: 'Failed to get user triggers',
    })
  }
}

export const getAllUserDeployments = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  try {
    // Get all user's agents
    const agents = await Agent.find({
      owner: currentUserId,
      deleted: false,
    }).select('_id name username userImage')

    const agentIds = agents.map(agent => agent._id)

    if (agentIds.length === 0) {
      return reply.status(200).send({
        deployments: [],
      })
    }

    type DeploymentWithAgent = typeof Deployment & {
      agent: {
        _id: string
        name: string
        username: string
        userImage: string
      }
    }

    // Get all deployments for user's agents
    const deployments = (await Deployment.find({
      agent: { $in: agentIds },
    }).populate({
      path: 'agent',
      select: '_id name username userImage',
      model: Agent,
    })) as DeploymentWithAgent[]

    // Force cloudfront URLs for agent images
    deployments.forEach(deployment => {
      if (deployment.agent && deployment.agent.userImage) {
        deployment.agent.userImage = forceCloudfrontUrl(
          server,
          deployment.agent.userImage,
        )
      }
    })

    return reply.status(200).send({
      deployments,
    })
  } catch (error) {
    console.error('Error getting user deployments:', error)
    return reply.status(500).send({
      error: 'Failed to get user deployments',
    })
  }
}

const validateAgentAccess = async (agentId: string) => {
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent || agent.deleted) {
    return { agent: null, error: 'Agent not found' }
  }

  return { agent, error: null }
}

const createAgentObjectId = (agentId: string, agentDoc: any, mongoose: any) => {
  return mongoose.Types.ObjectId.isValid(agentId)
    ? new mongoose.Types.ObjectId(agentId)
    : new mongoose.Types.ObjectId(agentDoc._id)
}

export const getAgentMemory = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_user')
    const memoryRecord = await memoryCollection.findOne({
      agent_id: createAgentObjectId(agentId, agent, server.mongoose),
      user_id: new server.mongoose.Types.ObjectId(userId),
    })

    let unabsorbedDirectives: string[] = []

    // Get unabsorbed directives if they exist
    if (memoryRecord?.unabsorbed_directive_ids?.length > 0) {
      const sessionMemoryCollection =
        server.mongoose.connection.db.collection('memory_sessions')
      const directiveIds = memoryRecord?.unabsorbed_directive_ids.map(
        (id: any) => new server.mongoose.Types.ObjectId(id),
      )

      const query = {
        agent_id: createAgentObjectId(agentId, agent, server.mongoose),
        memory_type: 'directive',
        related_users: new server.mongoose.Types.ObjectId(userId),
        _id: { $in: directiveIds },
      }

      const directives = await sessionMemoryCollection.find(query).toArray()

      unabsorbedDirectives = directives
        .map(directive => directive.content || '')
        .filter(content => content.trim() !== '')
    }

    return reply.status(200).send({
      content: memoryRecord?.content || '',
      unabsorbedDirectives,
    })
  } catch (error) {
    server.log.error('Error fetching user memory:', error)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}

export const saveAgentMemory = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const { content } = request.body as { content: string }
  const userId = request.user?.userId

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    const { agent, error } = await validateAgentAccess(agentId)
    if (error) {
      return reply.status(404).send({ error })
    }

    const memoryCollection =
      server.mongoose.connection.db.collection('memory_user')
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    await memoryCollection.replaceOne(
      {
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
      },
      {
        agent_id: agentObjectId,
        user_id: new server.mongoose.Types.ObjectId(userId),
        content: content || '',
        agent_owner: null,
        unabsorbed_directive_ids: [],
      },
      { upsert: true },
    )

    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error('Error saving user memory:', error)
    return reply.status(500).send({ error: 'Internal server error' })
  }
}
