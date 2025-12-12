import { Agent } from '../models/Agent'
import {
  AgentPermission,
  AgentPermissionLevel,
} from '../models/AgentPermission'
import { Deployment } from '../models/Deployment'
import { EmailDomain } from '../models/EmailDomain'
import {
  SessionPermission,
  SessionPermissionLevel,
} from '../models/SessionPermission'
import { Trigger } from '../models/Trigger'
import { Message } from '../models/v2/Message'
import { Session } from '../models/v2/SessionV2'
import { forceCloudfrontUrl } from '../plugins/s3Plugin'
import { createIdOrSlugQuery } from '../utils/mongoUtils'
import {
  AgentsDeployArguments,
  AgentsDeployResponse,
  AgentsStopDeploymentArguments,
  AgentsStopDeploymentResponse,
  AgentsUpdateDeploymentArguments,
  FeatureFlag,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

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
    level: AgentPermissionLevel.Owner,
  })

  return !!permission
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

export const executeTrigger = async (
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

  const trigger = await Trigger.findById(trigger_id)
  if (!trigger) {
    return reply.status(404).send({
      message: 'Trigger not found',
    })
  }

  // Check session-based permissions
  if (
    !(await canEditSession(
      trigger.session.toString(),
      currentUserId.toString(),
    ))
  ) {
    return reply.status(403).send({
      message: 'User not authorized to execute this trigger',
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
    server.log.error({ err: error }, 'Error executing trigger:')

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
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

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
    agent: agent._id,
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

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

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
    const configPayload: Record<string, any> = config
      ? JSON.parse(JSON.stringify(config))
      : {}
    const secretsPayload: Record<string, any> = secrets
      ? JSON.parse(JSON.stringify(secrets))
      : {}

    if (platform === 'email') {
      const emailDomain = await EmailDomain.findOne({ agent: agentId })

      if (!emailDomain) {
        return reply.status(400).send({
          error: 'Email domain has not been configured',
        })
      }

      if (emailDomain.status !== 'verified') {
        return reply.status(400).send({
          error: 'Email domain is not verified yet',
        })
      }

      const emailConfigInput = config?.email ?? {}

      configPayload.email = {
        domain_id: emailDomain._id.toString(),
        sender_email: emailConfigInput.sender_email,
        autoreply_enabled: emailConfigInput.autoreply_enabled ?? false,
        reply_delay_average_minutes:
          emailConfigInput.reply_delay_average_minutes ?? 0,
        reply_delay_variance_minutes:
          emailConfigInput.reply_delay_variance_minutes ?? 0,
      }

      secretsPayload.email = {
        domain: emailDomain.domain,
        provider_domain_id: emailDomain.provider_domain_id,
        inbound_route_id: emailDomain.inbound_route_id,
        inbound_route_expression: emailDomain.inbound_route_expression,
        forwarding_address: emailDomain.forwarding_address,
        webhook_signing_key:
          emailDomain.webhook_signing_key ||
          server.config.MAILGUN_WEBHOOK_SIGNING_KEY,
      }
    }

    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/create`,
      data: {
        agent: agentId,
        user: currentUserId,
        platform,
        secrets: secretsPayload,
        config: configPayload,
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

    if (platform === 'email') {
      await EmailDomain.updateOne(
        { agent: agentId },
        {
          $set: {
            deployment: new ObjectId(deployment.deployment_id),
          },
        },
      )
    }

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

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

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
    const configPayload: Record<string, any> = config
      ? JSON.parse(JSON.stringify(config))
      : {}
    const secretsPayload: Record<string, any> = secrets
      ? JSON.parse(JSON.stringify(secrets))
      : {}

    if (platform === 'email') {
      const emailDomain = await EmailDomain.findOne({ agent: agentId })

      if (!emailDomain) {
        return reply.status(400).send({
          error: 'Email domain has not been configured',
        })
      }

      if (emailDomain.status !== 'verified') {
        return reply.status(400).send({
          error: 'Email domain is not verified yet',
        })
      }

      const emailConfigInput = config?.email ?? {}

      configPayload.email = {
        domain_id: emailDomain._id.toString(),
        sender_email: emailConfigInput.sender_email,
        autoreply_enabled: emailConfigInput.autoreply_enabled ?? false,
        reply_delay_average_minutes:
          emailConfigInput.reply_delay_average_minutes ?? 0,
        reply_delay_variance_minutes:
          emailConfigInput.reply_delay_variance_minutes ?? 0,
      }

      secretsPayload.email = {
        domain: emailDomain.domain,
        provider_domain_id: emailDomain.provider_domain_id,
        inbound_route_id: emailDomain.inbound_route_id,
        inbound_route_expression: emailDomain.inbound_route_expression,
        forwarding_address: emailDomain.forwarding_address,
        webhook_signing_key:
          emailDomain.webhook_signing_key ||
          server.config.MAILGUN_WEBHOOK_SIGNING_KEY,
      }
    }

    // For Twitter only, update the deployment directly in MongoDB
    // Twitter doesn't have a workload running in the compute API
    if (platform === 'twitter') {
      const updateData: any = {}

      if (config) {
        // Deep merge the twitter config to preserve existing fields like username
        updateData.config = {
          ...deployment.config,
          twitter: {
            ...deployment.config?.twitter,
            ...configPayload.twitter,
          },
        }
      }

      if (secrets && Object.keys(secretsPayload).length > 0) {
        updateData.secrets = {
          ...deployment.secrets,
          ...secretsPayload,
        }
      }

      await Deployment.findByIdAndUpdate(deployment._id, updateData, {
        new: true,
      })

      return reply.status(200).send({
        deploymentId: deployment._id,
      })
    }

    // For all other platforms (including Farcaster), send to compute API
    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/update`,
      data: {
        deployment_id: deployment._id,
        config: configPayload,
        secrets: secretsPayload,
      },
    }

    await axios.post(modalRequest.endpoint, modalRequest.data, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    })

    if (platform === 'email') {
      await EmailDomain.updateOne(
        { agent: agentId },
        {
          $set: {
            deployment: deployment._id,
          },
        },
      )
    }

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

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

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

    if (platform === 'email') {
      const emailDomain = await EmailDomain.findOne({ agent: agentId })

      if (emailDomain) {
        try {
          await server.mailgun.deleteRoute(emailDomain.inbound_route_id)
        } catch (error: any) {
          server.log.error(
            { error },
            'Failed to delete email route from provider',
          )
        }

        try {
          await server.mailgun.deleteDomain(emailDomain.domain)
        } catch (error: any) {
          server.log.error(
            { error },
            'Failed to delete email domain from provider',
          )
        }

        await EmailDomain.deleteOne({ _id: emailDomain._id })
      }
    }

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
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  try {
    // Get all triggers owned by the user
    const triggers = await Trigger.find({
      user: currentUserId,
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
    }).populate({
      path: 'session',
      select: '_id name',
      model: Session,
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
  const { agentId } = request.params as { agentId: string }
  const userId = request.user?.userId
  const { startDate, endDate } = request.query as {
    startDate?: string
    endDate?: string
  }

  if (!userId) {
    return reply.status(401).send({ error: 'User not authenticated' })
  }

  try {
    // Validate agent access
    const { agent, error } = await validateAgentAccess(agentId)
    if (error || !agent) {
      return reply.status(404).send({ error })
    }

    // Check if user has edit access (using same permission logic as memory endpoints)
    const isOwner = await hasOwnerPermissions(agentId, userId.toString())

    const hasPermission = await AgentPermission.findOne({
      agent: agentId,
      user: userId,
      level: { $in: [AgentPermissionLevel.Owner, AgentPermissionLevel.Editor] },
    })

    const hasEditAccess = isOwner || !!hasPermission

    if (!hasEditAccess) {
      return reply.status(403).send({
        error:
          'You do not have permission to view dashboard data for this agent',
      })
    }

    // Default date range: last 30 days
    const now = new Date()
    const start = startDate
      ? (() => {
          const startDateObj = new Date(startDate)
          // Set to start of day to include all messages from that day
          startDateObj.setHours(0, 0, 0, 0)
          return startDateObj
        })()
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate
      ? (() => {
          const endDateObj = new Date(endDate)
          // Set to end of day to include all messages from that day
          endDateObj.setHours(23, 59, 59, 999)
          return endDateObj
        })()
      : now

    // Convert agentId to ObjectId for query
    const agentObjectId = createAgentObjectId(agentId, agent, server.mongoose)

    // First, get all sessions that contain this agent within the date range
    const sessionsWithAgent = await Session.find({
      agents: agentObjectId,
      updatedAt: { $gte: start },
      createdAt: { $lte: end },
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
    }).select('_id platform')

    if (sessionsWithAgent.length === 0) {
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

    // Extract session IDs and create a platform map
    const sessionIds = sessionsWithAgent.map(s => s._id)
    const sessionPlatformMap = new Map()
    sessionsWithAgent.forEach(s => {
      sessionPlatformMap.set(s._id.toString(), s.platform || 'web')
    })

    // Now query messages collection directly by session field
    const results = await Message.aggregate([
      // Stage 1: Match messages from sessions containing the agent
      {
        $match: {
          session: { $in: sessionIds },
          createdAt: { $gte: start, $lte: end },
        },
      },
      // Stage 2: Lookup usernames for message senders
      {
        $lookup: {
          from: 'users3',
          localField: 'sender',
          foreignField: '_id',
          pipeline: [
            {
              $project: {
                username: 1,
              },
            },
          ],
          as: 'senderData',
        },
      },
      // Stage 3: Project final structure with character count calculation
      {
        $project: {
          _id: 1,
          session: 1,
          sender: 1,
          role: { $ifNull: ['$role', '$name', 'unknown'] },
          username: {
            $ifNull: [{ $arrayElemAt: ['$senderData.username', 0] }, 'unknown'],
          },
          timestamp: '$createdAt',
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          charCount: {
            $cond: {
              if: {
                $and: [{ $ne: ['$content', null] }, { $ne: ['$content', ''] }],
              },
              then: { $strLenCP: '$content' },
              else: 0,
            },
          },
        },
      },
    ])

    if (results.length === 0) {
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

    // Convert aggregation results to messageDataList format
    const messageDataList = results.map(result => ({
      _id: result._id.toString(),
      platform: sessionPlatformMap.get(result.session.toString()) || 'web',
      role: result.role,
      username: result.username,
      timestamp: result.timestamp || new Date(),
      date: result.date,
      sender: result.sender.toString(),
      charCount: result.charCount || 0,
    }))

    // Calculate activity metadata for smart date range selection
    let oldestMessageDate: Date | null = null
    let newestMessageDate: Date | null = null

    if (messageDataList.length > 0) {
      const dates = messageDataList.map(m => new Date(m.timestamp))
      oldestMessageDate = new Date(Math.min(...dates.map(d => d.getTime())))
      newestMessageDate = new Date(Math.max(...dates.map(d => d.getTime())))
    }

    // Process data for bar chart (messages by date and platform)
    const messagesByDatePlatform = new Map()
    const userMessageCounts = new Map()
    const userTokenCounts = new Map()
    const platforms = new Set() // Don't pre-populate, let data drive platform detection
    const roles = new Set()

    messageDataList.forEach(message => {
      const { date, platform, role, username, charCount } = message

      // Track platforms and roles
      platforms.add(platform)
      roles.add(role)

      // Count messages and tokens by date and platform
      const key = `${date}-${platform}`
      if (!messagesByDatePlatform.has(key)) {
        messagesByDatePlatform.set(key, {
          date,
          platform,
          count: 0,
          tokenCount: 0,
        })
      }
      const entry = messagesByDatePlatform.get(key)
      entry.count++
      const tokensForMessage = Math.ceil(charCount / 4.5)
      entry.tokenCount += tokensForMessage

      // Count messages and tokens by username for pie chart (only user messages)
      if (role === 'user') {
        const currentUserMessages = userMessageCounts.get(username) || 0
        const currentUserTokens = userTokenCounts.get(username) || 0
        const tokensForUserMessage = Math.ceil(charCount / 4.5)

        userMessageCounts.set(username, currentUserMessages + 1)
        userTokenCounts.set(username, currentUserTokens + tokensForUserMessage)
      }
    })

    // Generate complete date range for bar chart
    const dateRange = []
    const currentDate = new Date(start)
    const endDateObj = new Date(end)

    while (currentDate <= endDateObj) {
      dateRange.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Use the platforms actually found in the data, fallback to ['web']
    let platformArray = Array.from(platforms)
    if (platformArray.length === 0) {
      platformArray = ['web']
    }

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
          tokenCount: existing?.tokenCount || 0,
        })
      }
    }

    // Convert user message counts to array format for pie chart
    const userStats = Array.from(userMessageCounts.entries())
      .map(([username, messageCount]) => ({
        username,
        messageCount,
        tokenCount: userTokenCounts.get(username) || 0,
      }))
      .sort((a, b) => b.messageCount - a.messageCount) // Sort by message count descending

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
      dateRange: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      },
      platforms: platformArray,
      roles: Array.from(roles),
      // Activity metadata for smart date range selection (performance optimized)
      activityMetadata: {
        oldestMessageDate: oldestMessageDate?.toISOString(),
        newestMessageDate: newestMessageDate?.toISOString(),
        totalMessages: messageDataList.length,
        hasRecentActivityOnly: oldestMessageDate
          ? Date.now() - oldestMessageDate.getTime() <= 7 * 24 * 60 * 60 * 1000
          : false,
      },
    }

    return reply.status(200).send(responseData)
  } catch (error) {
    server.log.error({ err: error }, 'Error fetching dashboard data:')
    return reply.status(500).send({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Helper to check if user can edit a session (owner or editor)
const canEditSession = async (
  sessionId: string,
  userId: string,
): Promise<boolean> => {
  const sessionDoc = await Session.findById(sessionId)
  if (!sessionDoc) return false

  // Check if user is session owner
  if (sessionDoc.owner.toString() === userId) return true

  // Check if user has editor or owner permission
  const permission = await SessionPermission.findOne({
    session: sessionId,
    user: userId,
    level: {
      $in: [SessionPermissionLevel.Owner, SessionPermissionLevel.Editor],
    },
  })

  return !!permission
}

// Session-based trigger functions

export const createTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { name, prompt, session, schedule } = request.body as {
    name: string
    prompt: string
    session: string
    schedule: any
  }
  const currentUserId = request.user.userId

  server.log.info({ session, name }, '[createTrigger] Creating trigger')

  const sessionDoc = await Session.findById(session)
  if (!sessionDoc) {
    return reply.status(404).send({ error: 'Session not found' })
  }

  if (!(await canEditSession(session, currentUserId.toString()))) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to create triggers for this session' })
  }

  const triggerData = {
    user: currentUserId,
    session,
    name,
    prompt,
    schedule,
  }

  server.log.info({ triggerData }, '[createTrigger] Sending to compute API')

  try {
    const response = await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/triggers/create`,
      triggerData,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    server.log.info(
      { trigger: response.data },
      '[createTrigger] Compute API response',
    )
    return reply.status(200).send({ trigger: response.data })
  } catch (error) {
    server.log.error({ err: error }, '[createTrigger] Error from compute API')
    throw error
  }
}

export const updateTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { triggerId } = request.params as { triggerId: string }
  const { name, prompt, schedule, status } = request.body as {
    name?: string
    prompt?: string
    schedule?: any
    status?: 'active' | 'paused' | 'finished'
  }
  const currentUserId = request.user.userId

  server.log.info({ triggerId }, '[updateTrigger] Updating trigger')

  const trigger = await Trigger.findById(triggerId)
  if (!trigger) {
    return reply.status(404).send({ error: 'Trigger not found' })
  }

  if (!trigger.session) {
    return reply
      .status(400)
      .send({ error: 'Trigger has no associated session' })
  }

  if (
    !(await canEditSession(
      trigger.session.toString(),
      currentUserId.toString(),
    ))
  ) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to update this trigger' })
  }

  const updateData: any = { id: triggerId }
  if (name !== undefined) updateData.name = name
  if (prompt !== undefined) updateData.prompt = prompt
  if (schedule !== undefined) updateData.schedule = schedule
  if (status !== undefined) updateData.status = status

  server.log.info({ updateData }, '[updateTrigger] Sending to compute API')

  try {
    const response = await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/triggers/update`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    server.log.info(
      { trigger: response.data },
      '[updateTrigger] Compute API response',
    )
    return reply.status(200).send({ trigger: response.data })
  } catch (error) {
    server.log.error({ err: error }, '[updateTrigger] Error from compute API')
    throw error
  }
}

export const deleteTrigger = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { triggerId } = request.params as { triggerId: string }
  const currentUserId = request.user.userId

  server.log.info({ triggerId }, '[deleteTrigger] Deleting trigger')

  const trigger = await Trigger.findById(triggerId)
  if (!trigger) {
    return reply.status(404).send({ error: 'Trigger not found' })
  }

  if (!trigger.session) {
    return reply
      .status(400)
      .send({ error: 'Trigger has no associated session' })
  }

  if (
    !(await canEditSession(
      trigger.session.toString(),
      currentUserId.toString(),
    ))
  ) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to delete this trigger' })
  }

  try {
    const response = await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/triggers/delete`,
      { id: triggerId },
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    server.log.info(
      { response: response.data },
      '[deleteTrigger] Compute API response',
    )
    return reply.status(200).send({ success: true })
  } catch (error) {
    server.log.error({ err: error }, '[deleteTrigger] Error from compute API')
    throw error
  }
}
