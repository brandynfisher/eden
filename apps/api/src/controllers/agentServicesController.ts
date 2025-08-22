import { Agent } from '../models/Agent'
import { AgentPermission, PermissionLevel } from '../models/AgentPermission'
import { Deployment } from '../models/Deployment'
import { Trigger } from '../models/Trigger'
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

    console.log('[Backend Dashboard] Step 5: Converting agent ID to ObjectId')
    // Convert agentId to ObjectId for query
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)
    console.log(`[Backend Dashboard] Agent ObjectId: ${agentObjectId}`)

    console.log('[Backend Dashboard] Step 5: Running MongoDB aggregation')
    // Test basic session count first
    const sessionCount = await Session.countDocuments({
      agents: agentObjectId,
      createdAt: { $gte: start, $lte: end },
    })
    console.log(
      `[Backend Dashboard] Total sessions in date range: ${sessionCount}`,
    )

    // Session activity aggregation with simplified approach
    console.log('[Backend Dashboard] Running full aggregation pipeline...')
    const sessionActivity = await Session.aggregate([
      {
        $match: {
          agents: agentObjectId,
          createdAt: { $gte: start, $lte: end },
          $or: [{ deleted: { $exists: false } }, { deleted: false }],
        },
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'messages',
          foreignField: '_id',
          as: 'messageDetails',
        },
      },
      {
        $addFields: {
          date: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          platform: {
            $cond: {
              if: { $eq: ['$platform', null] },
              then: 'web',
              else: { $ifNull: ['$platform', 'web'] },
            },
          },
          userMessageCount: {
            $size: {
              $filter: {
                input: '$messageDetails',
                cond: { $eq: ['$$this.role', 'user'] },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: { date: '$date', platform: '$platform' },
          totalUserMessages: { $sum: '$userMessageCount' },
          sessionCount: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': 1, '_id.platform': 1 },
      },
    ])

    console.log(
      `[Backend Dashboard] Aggregation completed. Found ${sessionActivity.length} activity records`,
    )

    console.log('[Backend Dashboard] Step 6: Processing data')
    // Generate complete date range with zero values for missing dates
    const dateRange = []
    const currentDate = new Date(start)
    const endDateObj = new Date(end)

    while (currentDate <= endDateObj) {
      dateRange.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    console.log(
      `[Backend Dashboard] Generated ${dateRange.length} dates in range`,
    )

    // Get unique platforms from the data
    const platforms = [
      ...new Set(sessionActivity.map(item => item._id.platform)),
    ]
    if (platforms.length === 0) platforms.push('web') // Ensure at least one platform
    console.log(`[Backend Dashboard] Found platforms: ${platforms.join(', ')}`)

    // Fill in missing date/platform combinations with zero values
    const completeData = []
    for (const date of dateRange) {
      for (const platform of platforms) {
        const existing = sessionActivity.find(
          item => item._id.date === date && item._id.platform === platform,
        )
        completeData.push({
          date,
          platform,
          totalUserMessages: existing?.totalUserMessages || 0,
          sessionCount: existing?.sessionCount || 0,
        })
      }
    }

    console.log(
      `[Backend Dashboard] Returning ${completeData.length} data points for ${platforms.length} platforms`,
    )

    const responseData = {
      sessionActivity: completeData,
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      platforms,
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
