import { calculateNextScheduledRun } from '../lib/calculateNextScheduledRun'
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

  const trigger = await Trigger.findById(trigger_id).populate('agent')
  if (!trigger) {
    return reply.status(404).send({
      message: 'Trigger not found',
    })
  }

  // Check permissions based on whether trigger has session or agent
  if (trigger.session) {
    // Session-based trigger - check session permissions
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
  } else if (trigger.agent) {
    // Agent-based trigger (null session) - check agent ownership
    const agentDoc =
      typeof trigger.agent === 'string'
        ? await Agent.findById(trigger.agent)
        : trigger.agent
    if (
      !agentDoc ||
      !('owner' in agentDoc) ||
      agentDoc.owner.toString() !== currentUserId.toString()
    ) {
      return reply.status(403).send({
        message: 'User not authorized to execute this trigger',
      })
    }
  } else {
    return reply.status(400).send({
      message: 'Trigger has neither session nor agent',
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
    // Find all sessions where user has edit or owner permissions via SessionPermission
    const sharedSessionPermissions = await SessionPermission.find({
      user: currentUserId,
      level: {
        $in: [SessionPermissionLevel.Owner, SessionPermissionLevel.Editor],
      },
    }).select('session')

    const sharedSessionIds = sharedSessionPermissions.map(p => p.session)

    // Find all sessions where user is the owner
    const ownedSessions = await Session.find({
      owner: currentUserId,
    }).select('_id')

    const ownedSessionIds = ownedSessions.map(s => s._id)

    // Combine both lists of session IDs
    const allAccessibleSessionIds = [...sharedSessionIds, ...ownedSessionIds]

    // Find all agents owned by the user (for triggers with null session)
    const ownedAgents = await Agent.find({
      owner: currentUserId,
    }).select('_id')

    const ownedAgentIds = ownedAgents.map(a => a._id)

    // Get all triggers where:
    // 1. User created the trigger, OR
    // 2. Trigger is in a session owned by user, OR
    // 3. Trigger is in a session shared with user (with edit/owner permissions), OR
    // 4. Trigger has an agent owned by user (for null session triggers) - only non-subscriptions
    // AND exclude deleted triggers
    const triggers = await Trigger.find({
      $and: [
        {
          $or: [
            // Triggers created by user
            { user: currentUserId },
            // Triggers in sessions owned or shared with user
            { session: { $in: allAccessibleSessionIds } },
            // Triggers with agent owned by user (for null session) - exclude subscriptions
            // to prevent seeing other users' subscriptions to your agent's tasks
            {
              $and: [
                { agent: { $in: ownedAgentIds } },
                {
                  $or: [
                    { parent_trigger: { $exists: false } },
                    { parent_trigger: null },
                  ],
                },
              ],
            },
          ],
        },
        // Exclude deleted triggers
        { $or: [{ deleted: { $exists: false } }, { deleted: false }] },
      ],
    })
      .populate({
        path: 'session',
        select: '_id title agents',
        model: Session,
        populate: {
          path: 'agents',
          select: '_id username userImage name',
        },
      })
      .populate({
        path: 'agent',
        select: '_id username userImage name',
        model: Agent,
      })
      .populate({
        path: 'parent_trigger',
        select: '_id user',
      })

    // Get IDs of all triggers owned by this user (to filter out subscriptions to own tasks)
    const ownTriggerIds = new Set(
      triggers
        .filter(
          t =>
            t.user?.toString() === currentUserId.toString() &&
            !t.parent_trigger,
        )
        .map(t => t._id.toString()),
    )

    // Filter out subscriptions where the parent_trigger is one of the user's own triggers
    const filteredTriggers = triggers.filter(trigger => {
      if (!trigger.parent_trigger) return true
      // Get parent trigger ID whether it's populated or not
      const pt = trigger.parent_trigger as
        | { _id?: { toString(): string } }
        | { toString(): string }
      const parentTriggerId =
        typeof pt === 'object' && pt !== null && '_id' in pt && pt._id
          ? pt._id.toString()
          : String(pt)
      // Filter out if the parent trigger is one of the user's own triggers
      return !ownTriggerIds.has(parentTriggerId)
    })

    return reply.status(200).send({
      triggers: filteredTriggers,
    })
  } catch (error) {
    console.error('Error getting user triggers:', error)
    return reply.status(500).send({
      error: 'Failed to get user triggers',
    })
  }
}

export const getSessionTriggers = async (
  _server: FastifyInstance,
  request: FastifyRequest<{ Params: { sessionId: string } }>,
  reply: FastifyReply,
) => {
  const { sessionId } = request.params
  const currentUserId = request.user.userId

  try {
    // Verify user has access to the session
    if (!(await canViewSession(sessionId, currentUserId.toString()))) {
      return reply
        .status(401)
        .send({ error: 'Not authorized to view this session' })
    }

    // Get all non-deleted triggers for this session
    const triggers = await Trigger.find({
      session: sessionId,
      $or: [{ deleted: { $exists: false } }, { deleted: false }],
    })

    return reply.status(200).send({ triggers })
  } catch (error) {
    console.error('Error getting session triggers:', error)
    return reply.status(500).send({
      error: 'Failed to get session triggers',
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

// Helper to check if user can view a session (owner, editor, or viewer)
const canViewSession = async (
  sessionId: string,
  userId: string,
): Promise<boolean> => {
  const sessionDoc = await Session.findById(sessionId)
  if (!sessionDoc) return false

  // Check if user is session owner
  if (sessionDoc.owner.toString() === userId) return true

  // Check if user has any permission level
  const permission = await SessionPermission.findOne({
    session: sessionId,
    user: userId,
    level: {
      $in: [
        SessionPermissionLevel.Owner,
        SessionPermissionLevel.Editor,
        SessionPermissionLevel.Viewer,
      ],
    },
  })

  return !!permission
}

// Session-based trigger functions

export const createTrigger = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  console.log(
    '[createTrigger] Request body:',
    JSON.stringify(request.body, null, 2),
  )

  const { name, prompt, session, agent, schedule } = request.body as {
    name: string
    prompt: string
    session?: string
    agent?: string // Agent username
    schedule?: any // Optional - tasks without schedules run manually only
  }
  const currentUserId = request.user.userId

  console.log('[createTrigger] Parsed values:', {
    name,
    prompt,
    session,
    agent,
    schedule,
    currentUserId,
  })

  // Either session or agent must be provided
  if (!session && !agent) {
    return reply
      .status(400)
      .send({ error: 'Either session or agent must be provided' })
  }

  let agentId: string | undefined

  // Validate session if provided
  if (session) {
    const sessionDoc = await Session.findById(session)
    if (!sessionDoc) {
      return reply.status(404).send({ error: 'Session not found' })
    }

    // Check permissions
    if (!(await canEditSession(session, currentUserId.toString()))) {
      return reply
        .status(401)
        .send({ error: 'Not authorized to create triggers for this session' })
    }
  }

  // Validate and lookup agent if provided
  if (agent) {
    const agentDoc = await Agent.findOne({ username: agent })
    if (!agentDoc) {
      return reply.status(404).send({ error: 'Agent not found' })
    }
    agentId = agentDoc._id.toString()

    // Check if user owns the agent
    if (agentDoc.owner.toString() !== currentUserId.toString()) {
      return reply
        .status(401)
        .send({ error: 'Not authorized to create triggers for this agent' })
    }
  }

  // Calculate next scheduled run (only if schedule is provided)
  let next_scheduled_run: Date | null = null
  if (schedule) {
    console.log(
      '[createTrigger] Calculating next scheduled run for schedule:',
      JSON.stringify(schedule),
    )
    next_scheduled_run = calculateNextScheduledRun(schedule)
    console.log('[createTrigger] next_scheduled_run:', next_scheduled_run)
    if (!next_scheduled_run) {
      console.log(
        '[createTrigger] ERROR: Schedule validation failed - no next run calculated',
      )
      return reply
        .status(400)
        .send({ error: 'Invalid schedule or schedule has already ended' })
    }
  } else {
    console.log(
      '[createTrigger] No schedule provided - task will run manually only',
    )
  }

  // Save directly to MongoDB
  const trigger = new Trigger({
    user: currentUserId,
    ...(session && { session }),
    ...(agentId && { agent: agentId }),
    name,
    prompt,
    ...(schedule && { schedule }),
    status: 'active',
    ...(next_scheduled_run && { next_scheduled_run }),
  })
  await trigger.save()

  return reply.status(200).send({ trigger })
}

export const updateTrigger = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { triggerId } = request.params as { triggerId: string }
  const { name, prompt, schedule, status, subscribable } = request.body as {
    name?: string
    prompt?: string
    schedule?: any
    status?: 'active' | 'paused' | 'finished'
    subscribable?: boolean
  }
  const currentUserId = request.user.userId

  const trigger = await Trigger.findById(triggerId)
  if (!trigger) {
    return reply.status(404).send({ error: 'Trigger not found' })
  }

  // Check permissions - either session-based or user-owned
  let hasPermission = false

  if (trigger.session) {
    hasPermission = await canEditSession(
      trigger.session.toString(),
      currentUserId.toString(),
    )
  } else if (trigger.user.toString() === currentUserId.toString()) {
    // User owns this trigger directly (agent-based trigger without session)
    hasPermission = true
  }

  if (!hasPermission) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to update this trigger' })
  }

  // Build update object
  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (prompt !== undefined) updateData.prompt = prompt
  if (status !== undefined) updateData.status = status
  if (subscribable !== undefined) updateData.subscribable = subscribable

  // If schedule changed, recalculate next_scheduled_run
  if (schedule !== undefined) {
    updateData.schedule = schedule
    const next_scheduled_run = calculateNextScheduledRun(schedule)
    if (next_scheduled_run) {
      updateData.next_scheduled_run = next_scheduled_run
    } else {
      // Schedule has ended or is invalid
      updateData.status = 'finished'
      updateData.next_scheduled_run = null
    }
  }

  // If resuming from paused, recalculate next_scheduled_run
  if (status === 'active' && trigger.status === 'paused') {
    const next_scheduled_run = calculateNextScheduledRun(
      schedule ?? trigger.schedule,
    )
    if (next_scheduled_run) {
      updateData.next_scheduled_run = next_scheduled_run
      // Reset error count when resuming
      updateData.error_count = 0
      updateData.last_error = null
    }
  }

  // Update directly in MongoDB
  const updatedTrigger = await Trigger.findByIdAndUpdate(
    triggerId,
    { $set: updateData },
    { new: true },
  )

  // Cascade schedule changes to child triggers (subscriptions)
  if (schedule !== undefined && trigger.subscribable) {
    console.log(
      '[updateTrigger] Cascading schedule to subscribers of trigger:',
      triggerId,
    )

    const childUpdateData: Record<string, unknown> = {
      schedule: schedule,
    }

    // Recalculate next_scheduled_run for children
    const childNextRun = calculateNextScheduledRun(schedule)
    if (childNextRun) {
      childUpdateData.next_scheduled_run = childNextRun
    } else {
      childUpdateData.next_scheduled_run = null
    }

    const cascadeResult = await Trigger.updateMany(
      { parent_trigger: trigger._id, deleted: { $ne: true } },
      { $set: childUpdateData },
    )
    console.log(
      '[updateTrigger] Cascade result:',
      cascadeResult.modifiedCount,
      'triggers updated',
    )
  }

  return reply.status(200).send({ trigger: updatedTrigger })
}

export const deleteTrigger = async (
  _server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { triggerId } = request.params as { triggerId: string }
  const currentUserId = request.user.userId

  const trigger = await Trigger.findById(triggerId)
  if (!trigger) {
    return reply.status(404).send({ error: 'Trigger not found' })
  }

  // Check permissions - either session-based or user-owned
  let hasPermission = false

  if (trigger.session) {
    hasPermission = await canEditSession(
      trigger.session.toString(),
      currentUserId.toString(),
    )
  } else if (trigger.user.toString() === currentUserId.toString()) {
    // User owns this trigger directly (e.g., subscription triggers without session)
    hasPermission = true
  }

  if (!hasPermission) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to delete this trigger' })
  }

  // Soft delete directly in MongoDB
  await Trigger.findByIdAndUpdate(triggerId, { deleted: true })

  return reply.status(200).send({ success: true })
}

// Discord channel management

export const getDiscordChannels = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const currentUserId = request.user.userId

  server.log.info(
    { agentId, currentUserId },
    '[getDiscordChannels] Request received',
  )

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    server.log.warn({ agentId }, '[getDiscordChannels] Agent not found')
    return reply.status(404).send({ error: 'Agent not found' })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    server.log.warn(
      { agentId, currentUserId },
      '[getDiscordChannels] User not authorized',
    )
    return reply.status(401).send({
      error: 'User not authorized to view channels for this agent',
    })
  }

  // Find Discord deployment for this agent
  const deployment = await Deployment.findOne({
    agent: agent._id,
    platform: 'discord',
  })

  if (!deployment) {
    server.log.warn(
      { agentId },
      '[getDiscordChannels] Discord deployment not found',
    )
    return reply.status(404).send({ error: 'Discord deployment not found' })
  }

  server.log.info(
    { deploymentId: deployment._id },
    '[getDiscordChannels] Found deployment, calling Eve API',
  )

  try {
    const url = `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/${deployment._id}/discord-channels`
    server.log.info({ url }, '[getDiscordChannels] Calling Eve API')

    const response = await axios.get(url, {
      params: { user_id: currentUserId },
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    })

    server.log.info(
      { guildsCount: response.data?.guilds?.length },
      '[getDiscordChannels] Eve API response',
    )
    return reply.status(200).send(response.data)
  } catch (error: any) {
    server.log.error(
      { err: error, response: error.response?.data },
      '[getDiscordChannels] Error from Eve API',
    )
    return reply.status(error.response?.status || 500).send({
      error: error.response?.data?.message || 'Failed to get Discord channels',
    })
  }
}

export const refreshDiscordChannels = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const currentUserId = request.user.userId

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({ error: 'Agent not found' })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to refresh channels for this agent',
    })
  }

  // Find Discord deployment for this agent
  const deployment = await Deployment.findOne({
    agent: agent._id,
    platform: 'discord',
  })

  if (!deployment) {
    return reply.status(404).send({ error: 'Discord deployment not found' })
  }

  try {
    const response = await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/${deployment._id}/discord-refresh`,
      {
        deployment_id: deployment._id.toString(),
        user_id: currentUserId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    return reply.status(200).send(response.data)
  } catch (error: any) {
    server.log.error({ err: error }, 'Error refreshing Discord channels')
    return reply.status(error.response?.status || 500).send({
      error:
        error.response?.data?.message || 'Failed to refresh Discord channels',
    })
  }
}

export const syncDiscordSessions = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { agentId } = request.params as { agentId: string }
  const currentUserId = request.user.userId

  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({ error: 'Agent not found' })
  }

  if (
    !(await hasOwnerPermissions(agent._id.toString(), currentUserId.toString()))
  ) {
    return reply.status(401).send({
      error: 'User not authorized to sync sessions for this agent',
    })
  }

  // Find Discord deployment for this agent
  const deployment = await Deployment.findOne({
    agent: agent._id,
    platform: 'discord',
  })

  if (!deployment) {
    return reply.status(404).send({ error: 'Discord deployment not found' })
  }

  try {
    const response = await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/v2/deployments/${deployment._id}/discord-sync`,
      {
        deployment_id: deployment._id.toString(),
        user_id: currentUserId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    return reply.status(200).send(response.data)
  } catch (error: any) {
    server.log.error({ err: error }, 'Error syncing Discord sessions')
    return reply.status(error.response?.status || 500).send({
      error: error.response?.data?.message || 'Failed to sync Discord sessions',
    })
  }
}

// ============================================================================
// Trigger Subscription Endpoints
// ============================================================================

/**
 * Get all subscribable triggers for a specific agent (public endpoint)
 */
export const getAgentSubscribableTriggers = async (
  _server: FastifyInstance,
  request: FastifyRequest<{ Params: { agentId: string } }>,
  reply: FastifyReply,
) => {
  const { agentId } = request.params

  // Find the agent by ID or username
  const query = createIdOrSlugQuery(agentId)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({ error: 'Agent not found' })
  }

  // Find all sessions that include this agent
  const sessionsWithAgent = await Session.find({
    agents: agent._id,
  }).select('_id')

  const sessionIds = sessionsWithAgent.map(s => s._id)

  // Find all subscribable triggers for this agent
  // Either directly linked to agent OR linked to a session with this agent
  const triggers = await Trigger.find({
    subscribable: true,
    $or: [{ agent: agent._id }, { session: { $in: sessionIds } }],
    $and: [{ $or: [{ deleted: { $exists: false } }, { deleted: false }] }],
  })
    .populate('user', 'username name userImage')
    .sort({ createdAt: -1 })

  return reply.status(200).send({ triggers })
}

/**
 * Subscribe to a trigger (creates a copy for the current user)
 */
export const subscribeToTrigger = async (
  _server: FastifyInstance,
  request: FastifyRequest<{ Params: { triggerId: string } }>,
  reply: FastifyReply,
) => {
  const { triggerId } = request.params
  const currentUserId = request.user.userId

  console.log('[subscribeToTrigger] Request:', {
    triggerId,
    currentUserId,
  })

  // Find the parent trigger
  const parentTrigger = await Trigger.findById(triggerId)
  if (!parentTrigger) {
    console.log('[subscribeToTrigger] ERROR: Trigger not found')
    return reply.status(404).send({ error: 'Trigger not found' })
  }

  console.log('[subscribeToTrigger] Parent trigger:', {
    _id: parentTrigger._id,
    name: parentTrigger.name,
    subscribable: parentTrigger.subscribable,
    owner: parentTrigger.user.toString(),
  })

  // Verify it's subscribable
  if (!parentTrigger.subscribable) {
    console.log('[subscribeToTrigger] ERROR: Trigger is not subscribable')
    return reply.status(400).send({ error: 'This trigger is not subscribable' })
  }

  // Check if user is trying to subscribe to their own trigger
  if (parentTrigger.user.toString() === currentUserId.toString()) {
    console.log(
      '[subscribeToTrigger] ERROR: User trying to subscribe to own trigger',
    )
    return reply
      .status(400)
      .send({ error: 'You cannot subscribe to your own trigger' })
  }

  // Check if user has already subscribed to this trigger
  const existingSubscription = await Trigger.findOne({
    parent_trigger: parentTrigger._id,
    user: currentUserId,
    $or: [{ deleted: { $exists: false } }, { deleted: false }],
  })

  if (existingSubscription) {
    console.log('[subscribeToTrigger] ERROR: User already subscribed', {
      existingSubscriptionId: existingSubscription._id,
    })
    return reply
      .status(400)
      .send({ error: 'You have already subscribed to this trigger' })
  }

  // Calculate next scheduled run for the new trigger
  let next_scheduled_run: Date | null = null
  if (parentTrigger.schedule) {
    next_scheduled_run = calculateNextScheduledRun(parentTrigger.schedule)
  }

  // Create the subscription (copy of the trigger)
  const subscriptionTrigger = new Trigger({
    user: currentUserId,
    session: null, // Will create new session on first run
    agent: parentTrigger.agent,
    parent_trigger: parentTrigger._id,
    name: parentTrigger.name,
    prompt: parentTrigger.prompt,
    schedule: parentTrigger.schedule,
    status: 'active',
    subscribable: false, // Subscriptions cannot be re-subscribed
    ...(next_scheduled_run && { next_scheduled_run }),
  })

  await subscriptionTrigger.save()

  console.log('[subscribeToTrigger] SUCCESS: Subscription created', {
    subscriptionId: subscriptionTrigger._id,
    parentTriggerId: parentTrigger._id,
    userId: currentUserId,
  })

  return reply.status(200).send({ trigger: subscriptionTrigger })
}

/**
 * Get subscribers for a trigger (only the owner can see)
 */
export const getTriggerSubscribers = async (
  _server: FastifyInstance,
  request: FastifyRequest<{ Params: { triggerId: string } }>,
  reply: FastifyReply,
) => {
  const { triggerId } = request.params
  const currentUserId = request.user.userId

  // Find the trigger
  const trigger = await Trigger.findById(triggerId)
  if (!trigger) {
    return reply.status(404).send({ error: 'Trigger not found' })
  }

  // Only the owner can see subscribers
  if (trigger.user.toString() !== currentUserId.toString()) {
    return reply
      .status(401)
      .send({ error: 'Not authorized to view subscribers' })
  }

  // Find all subscriptions to this trigger
  const subscriptions = await Trigger.find({
    parent_trigger: trigger._id,
    $or: [{ deleted: { $exists: false } }, { deleted: false }],
  }).populate('user', 'username name userImage')

  // Extract user info from subscriptions
  const subscribers = subscriptions.map(sub => sub.user)

  return reply.status(200).send({
    subscribers,
    count: subscribers.length,
  })
}
