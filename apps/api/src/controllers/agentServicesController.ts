import { Agent } from '../models/Agent'
import { AgentPermission, PermissionLevel } from '../models/AgentPermission'
import { Deployment } from '../models/Deployment'
import { Trigger } from '../models/Trigger'
import { User } from '../models/User'
import { Message } from '../models/v2/Message'
import { Session } from '../models/v2/SessionV2'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import { createIdOrSlugQuery } from '../utils/mongoUtils'
import {
  AgentsCreateTriggerArguments,
  AgentsCreateTriggerResponse,
  AgentsDeleteTriggerResponse,
  AgentsDeployArguments,
  AgentsDeployResponse,
  AgentsStopDeploymentArguments,
  AgentsStopDeploymentResponse,
  AgentsUpdateDeploymentArguments,
  FeatureFlag,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

// Helper function to check if user has owner-level permissions
const hasOwnerPermissions = async (
  agentId: string,
  userId: string,
): Promise<boolean> => {
  // Check if user is the original owner
  const agent = await Agent.findById(agentId)
  if (!agent) return false

  if (agent.owner.toString() === userId) {
    return true
  }

  // Check if user has owner permission
  const permission = await AgentPermission.findOne({
    agent: agentId,
    user: userId,
    level: PermissionLevel.Owner,
  })

  return !!permission
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

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
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

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
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

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
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

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
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

export const executeAgentTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { trigger_id } = request.body as { trigger_id: string }
  const currentUserId = request.user.userId

  if (!trigger_id) {
    return reply.status(400).send({
      message: 'Missing trigger_id',
    })
  }

  // First, get the trigger to check ownership
  const trigger = await Trigger.findById(trigger_id)
  if (!trigger) {
    return reply.status(404).send({
      message: 'Trigger not found',
    })
  }

  // Check if the user owns the agent that this trigger belongs to
  const agent = await Agent.findById(trigger.agent)
  if (!agent) {
    return reply.status(404).send({
      message: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(403).send({
      message: 'User not authorized to execute triggers for this agent',
    })
  }

  try {
    const edenComputeRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/triggers/run`,
      data: { trigger_id },
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
      trigger_id,
      executed: response.executed || true,
      chat_response: response.chat_response,
    })
  } catch (error) {
    console.error('Error executing trigger:', error)

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message =
        error.response?.data?.message || 'Failed to execute trigger'

      return reply.status(status).send({
        message,
      })
    }

    return reply.status(500).send({
      message: 'Internal server error',
    })
  }
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

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
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

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
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
  const { agentId } = request.params as { agentId: string }
  const { platform, config, secrets } =
    request.body as AgentsUpdateDeploymentArguments

  const agent = await Agent.findById(agentId)

  if (!agent) {
    return reply.status(404).send({
      error: 'Agent not found',
    })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
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
        secrets,
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

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
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

// Get dashboard data for an agent
export const getDashboardData = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  console.log('[Backend Dashboard] Starting getDashboardData')

  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId
  const { startDate, endDate } = request.query as {
    startDate?: string
    endDate?: string
  }

  console.log(
    `[Backend Dashboard] Params - agentId: ${agentId}, userId: ${userId}`,
  )
  console.log(
    `[Backend Dashboard] Query - startDate: ${startDate}, endDate: ${endDate}`,
  )

  if (!userId) {
    console.log('[Backend Dashboard] Error: User not authenticated')
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    console.log('[Backend Dashboard] Step 1: Validating agent access')
    // Validate agent access
    const { agent, error } = await validateAgentAccess(agentId)
    if (error || !agent) {
      console.log(`[Backend Dashboard] Agent validation failed: ${error}`)
      return reply.status(404).send({ error })
    }
    console.log(
      `[Backend Dashboard] Agent validation successful: ${agent.name}`,
    )

    console.log('[Backend Dashboard] Step 2: Checking permissions')

    // Log agent owner information
    console.log(`[Backend Dashboard] Agent owner ID: ${agent.owner}`)
    console.log(`[Backend Dashboard] Current user ID: ${userId}`)
    console.log(
      `[Backend Dashboard] Agent owner toString: ${agent.owner.toString()}`,
    )
    console.log(`[Backend Dashboard] User ID toString: ${userId.toString()}`)

    // Check if user has edit access (using same permission logic as memory endpoints)
    const isOwner = await hasOwnerPermissions(agentId, userId.toString())
    console.log(`[Backend Dashboard] Is owner: ${isOwner}`)

    const hasPermission = await AgentPermission.findOne({
      agent: agentId,
      user: userId,
      level: { $in: [PermissionLevel.Owner, PermissionLevel.Editor] },
    })
    console.log(`[Backend Dashboard] Has permission record: ${!!hasPermission}`)
    if (hasPermission) {
      console.log(
        `[Backend Dashboard] Permission level: ${hasPermission.level}`,
      )
    }

    // Let's also check what hasOwnerPermissions function does internally
    const agentForOwnerCheck = await Agent.findById(agentId)
    if (agentForOwnerCheck) {
      console.log(
        `[Backend Dashboard] Agent owner from DB: ${agentForOwnerCheck.owner}`,
      )
      console.log(
        `[Backend Dashboard] Owner comparison: ${
          agentForOwnerCheck.owner.toString() === userId.toString()
        }`,
      )
    }

    const hasEditAccess = isOwner || !!hasPermission
    console.log(`[Backend Dashboard] Final edit access: ${hasEditAccess}`)

    if (!hasEditAccess) {
      console.log(
        '[Backend Dashboard] Access denied - insufficient permissions',
      )
      return reply.status(403).send({
        error:
          'You do not have permission to view dashboard data for this agent',
      })
    }

    console.log('[Backend Dashboard] Step 3: Setting up date range')
    // Default date range: last 30 days
    const now = new Date()
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const start = startDate ? new Date(startDate) : defaultStartDate
    const end = endDate ? new Date(endDate) : now

    console.log(
      `[Backend Dashboard] Date range: ${start.toISOString()} to ${end.toISOString()}`,
    )

    console.log('[Backend Dashboard] Step 4: Converting agent ID to ObjectId')
    // Convert agentId to ObjectId for query
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)
    console.log(`[Backend Dashboard] Agent ObjectId: ${agentObjectId}`)

    console.log(
      '[Backend Dashboard] Step 5: Query 1 - Getting sessions for agent',
    )
    // Query 1: Get all sessions containing this agent (remove date filter from session query)
    const sessions = await Session.find({
      agents: agentObjectId,
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
    }).select('_id platform messages createdAt')

    console.log(
      `[Backend Dashboard] Found ${sessions.length} sessions for agent`,
    )

    if (sessions.length === 0) {
      console.log('[Backend Dashboard] No sessions found, returning empty data')
      return reply.status(200).send({
        messageActivity: [],
        userStats: [],
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
        platforms: ['web'],
      })
    }

    console.log(
      '[Backend Dashboard] Step 6: Query 2 - Getting messages from sessions',
    )
    // Query 2: Extract all message IDs from sessions and query messages collection
    const allMessageIds: string[] = []
    const sessionPlatformMap = new Map<string, string>()

    const sessionPlatforms = new Set<string>()
    sessions.forEach(session => {
      // Store platform for each session - handle potential missing platform field
      const sessionData = session as any
      const platform = sessionData.platform || 'web'
      sessionPlatforms.add(platform)
      sessionPlatformMap.set(session._id.toString(), platform)
      // Collect all message IDs from this session
      if (session.messages && Array.isArray(session.messages)) {
        allMessageIds.push(...session.messages.map(msg => msg.toString()))
      }
    })

    console.log(
      `[Backend Dashboard] Session platforms found:`,
      Array.from(sessionPlatforms),
    )

    console.log(
      `[Backend Dashboard] Collected ${allMessageIds.length} message IDs from sessions`,
    )

    if (allMessageIds.length === 0) {
      console.log(
        '[Backend Dashboard] No message IDs found in sessions, returning empty data',
      )
      return reply.status(200).send({
        messageActivity: [],
        userStats: [],
        sessionActivity: [],
        messageDataList: [],
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
        platforms: ['web'],
        roles: [],
      })
    }

    // Query messages collection with the collected message IDs, filtered by date range
    console.log('[Backend Dashboard] Querying messages with date filter:', {
      start: start.toISOString(),
      end: end.toISOString(),
      messageIds: allMessageIds.length,
    })

    const messages = await Message.find({
      _id: { $in: allMessageIds },
      createdAt: { $gte: start, $lte: end },
    }).select('_id session sender role name createdAt')

    console.log(
      `[Backend Dashboard] Found ${messages.length} messages in date range`,
    )

    if (messages.length === 0) {
      console.log(
        '[Backend Dashboard] No messages found in date range, checking without date filter...',
      )

      // Try without date filter to see if there are messages at all
      const allMessages = await Message.find({
        _id: { $in: allMessageIds.slice(0, 5) }, // Just check first 5
      }).select('_id createdAt')

      console.log(
        `[Backend Dashboard] Sample messages without date filter: ${allMessages.length}`,
      )
      allMessages.forEach(msg => {
        console.log(`[Backend Dashboard] Sample message date: ${msg.createdAt}`)
      })
    }

    // Process messages and collect unique sender IDs
    const uniqueSenderIds = new Set()
    const processedMessages = messages.map(message => {
      const senderId = message.sender.toString()
      uniqueSenderIds.add(senderId)

      return {
        _id: message._id,
        session: message.session,
        sender: message.sender,
        role: message.role || message.name || 'unknown',
        createdAt: message.createdAt,
        platform: sessionPlatformMap.get(message.session.toString()) || 'web',
      }
    })

    console.log(
      `[Backend Dashboard] Processed ${processedMessages.length} messages with ${uniqueSenderIds.size} unique senders`,
    )

    console.log(
      '[Backend Dashboard] Step 7: Query 3 - Getting usernames for sender IDs',
    )
    // Query 3: Get usernames from users3 collection for all sender IDs
    const users = await User.find({
      _id: { $in: Array.from(uniqueSenderIds) },
    }).select('_id username')

    // Create mapping from user ID to username
    const userIdToUsernameMap = new Map()
    users.forEach(user => {
      userIdToUsernameMap.set(user._id.toString(), user.username || 'unknown')
    })

    console.log(
      `[Backend Dashboard] Retrieved usernames for ${users.length} users`,
    )

    console.log('[Backend Dashboard] Step 8: Aggregating final message data')
    // Create final message data list with all required fields
    const messageDataList = processedMessages.map(message => ({
      _id: message._id.toString(),
      platform: message.platform,
      role: message.role,
      username: userIdToUsernameMap.get(message.sender.toString()) || 'unknown',
      timestamp: message.createdAt || new Date(),
      date: (message.createdAt || new Date()).toISOString().split('T')[0],
      sender: message.sender.toString(),
    }))

    console.log('[Backend Dashboard] Step 9: Processing data for charts')
    // Process data for bar chart (messages by date and platform)
    const messagesByDatePlatform = new Map()
    const userMessageCounts = new Map()
    const platforms = new Set() // Don't pre-populate, let data drive platform detection
    const roles = new Set()

    messageDataList.forEach(message => {
      const { date, platform, role, username } = message

      // Track platforms and roles
      platforms.add(platform)
      roles.add(role)

      // Count messages by date and platform
      const key = `${date}-${platform}`
      if (!messagesByDatePlatform.has(key)) {
        messagesByDatePlatform.set(key, { date, platform, count: 0 })
      }
      messagesByDatePlatform.get(key).count++

      // Count messages by username for pie chart
      userMessageCounts.set(
        username,
        (userMessageCounts.get(username) || 0) + 1,
      )
    })

    // Generate complete date range for bar chart
    const dateRange = []
    const currentDate = new Date(start)
    const endDateObj = new Date(end)

    while (currentDate <= endDateObj) {
      dateRange.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Use the platforms actually found in the data, fallback to sessionPlatforms, then ['web']
    let platformArray = Array.from(platforms)
    if (platformArray.length === 0) {
      platformArray = Array.from(sessionPlatforms)
    }
    if (platformArray.length === 0) {
      platformArray = ['web']
    }

    console.log(`[Backend Dashboard] Final platform array:`, platformArray)

    // Fill in missing date/platform combinations with zero values for bar chart
    const messageActivity = []

    for (const date of dateRange) {
      for (const platform of platformArray) {
        const key = `${date}-${platform}`
        const existing = messagesByDatePlatform.get(key)
        messageActivity.push({
          date,
          platform,
          messageCount: existing?.count || 0,
        })
      }
    }

    // Convert user message counts to array format for pie chart
    const userStats = Array.from(userMessageCounts.entries())
      .map(([username, count]) => ({ username, messageCount: count }))
      .sort((a, b) => b.messageCount - a.messageCount) // Sort by message count descending

    console.log(
      `[Backend Dashboard] Returning ${
        messageActivity.length
      } message activity points, ${userStats.length} user stats for ${
        platformArray.length
      } platforms and ${Array.from(roles).length} roles`,
    )

    // Debug logs for data structure
    console.log(
      '[Backend Dashboard] Sample messageActivity:',
      JSON.stringify(messageActivity.slice(0, 3), null, 2),
    )
    console.log(
      '[Backend Dashboard] Sample userStats:',
      JSON.stringify(userStats.slice(0, 3), null, 2),
    )
    console.log(
      '[Backend Dashboard] Sample messageDataList:',
      JSON.stringify(messageDataList.slice(0, 3), null, 2),
    )
    console.log('[Backend Dashboard] Platforms:', platformArray)
    console.log('[Backend Dashboard] Roles:', Array.from(roles))

    // For backward compatibility, also create sessionActivity with the old format
    // This aggregates messages back to the session level for existing frontend code
    const sessionActivityMap = new Map()
    messageDataList.forEach(message => {
      const key = `${message.date}-${message.platform}`
      if (!sessionActivityMap.has(key)) {
        sessionActivityMap.set(key, {
          date: message.date,
          platform: message.platform,
          totalUserMessages: 0,
          sessionCount: 0,
        })
      }
      if (message.role === 'user') {
        sessionActivityMap.get(key).totalUserMessages++
      }
    })

    // Fill in missing dates for sessionActivity (backward compatibility)
    const sessionActivity = []
    for (const date of dateRange) {
      for (const platform of platformArray) {
        const key = `${date}-${platform}`
        const existing = sessionActivityMap.get(key)
        sessionActivity.push({
          date,
          platform,
          totalUserMessages: existing?.totalUserMessages || 0,
          sessionCount: existing?.sessionCount || 0,
        })
      }
    }

    const responseData = {
      // Backward compatibility fields
      sessionActivity, // Old format for existing frontend
      // New enhanced data
      messageActivity, // New format showing all messages by actual timestamp
      userStats, // Pie chart data for user message counts
      messageDataList, // Raw message data for advanced filtering
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      platforms: platformArray,
      roles: Array.from(roles),
    }

    console.log('[Backend Dashboard] Success - sending response')
    return reply.status(200).send(responseData)
  } catch (error) {
    console.error('[Backend Dashboard] ERROR in getDashboardData:', error)

    // Log detailed error information
    if (error && typeof error === 'object') {
      console.error('[Backend Dashboard] Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code,
      })
    }

    server.log.error('Error fetching dashboard data:', error)
    return reply.status(500).send({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
