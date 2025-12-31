import { Agent } from '../../models/Agent'
import { DeviceToken } from '../../models/DeviceToken'
import { Notification } from '../../models/Notification'
import {
  SessionPermission,
  SessionPermissionDocument,
  SessionPermissionLevel,
} from '../../models/SessionPermission'
import { User } from '../../models/User'
import { UserPreferences } from '../../models/UserPreferences'
import { Message } from '../../models/v2/Message'
import { SessionShare } from '../../models/v2/SessionShareV2'
import { Session } from '../../models/v2/SessionV2'
import { QueryOptions } from '../../repositories/RestfulRepository'
import SessionRepository from '../../repositories/SessionRepository'
import { sendPushNotification } from '../../services/pushNotificationService'
import {
  createIdOrSlugQuery,
  createMultiFieldQuery,
} from '../../utils/mongoUtils'
import {
  FeatureFlag,
  SessionsV2CreateArguments,
  SessionsV2DeleteArguments,
  SessionsV2ListArguments,
  SessionsV2MessageArguments,
  SessionsV2MessageReactArguments,
  SessionsV2RenameArguments,
  SessionsV2ToolCallReactArguments,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

// Helper function to create eden messages for agent operations
const createEdenMessage = async (
  sessionId: ObjectId,
  messageType: 'agent_add' | 'agent_remove',
  agents: any[],
) => {
  const edenMessage = new Message({
    session: [sessionId],
    sender: new ObjectId('000000000000000000000000'), // System sender
    role: 'eden',
    content: '',
    eden_message_data: {
      message_type: messageType,
      agents: agents.map(agent => ({
        id: agent._id,
        name: agent.name || agent.username,
        avatar: agent.userImage,
      })),
    },
  })

  await edenMessage.save()
  return edenMessage
}

const INTERACTIVE_PERMISSION_LEVELS = new Set<SessionPermissionLevel>([
  SessionPermissionLevel.Owner,
  SessionPermissionLevel.Editor,
  SessionPermissionLevel.Participant,
])

const isUserActiveInSession = async (
  server: FastifyInstance,
  userId: ObjectId,
  sessionId: ObjectId,
) => {
  if (!server.redis) return false

  try {
    const key = `${server.redisEnvPrefix}:active_sessions:${userId.toString()}`
    const isMember = await server.redis.sismember(key, sessionId.toString())
    return Boolean(isMember)
  } catch (error) {
    server.log.warn(
      { err: error },
      '[NOTIFICATIONS] Failed to check session activity; defaulting to inactive',
    )
    return false
  }
}

const shouldThrottleSessionMessageNotification = async (
  server: FastifyInstance,
  userId: ObjectId,
  sessionId: ObjectId,
  ttlSeconds = 60,
) => {
  if (!server.redis) return false

  const key = `${
    server.redisEnvPrefix
  }:notif:session_message:${userId.toString()}:${sessionId.toString()}`

  try {
    const alreadySet = await server.redis.exists(key)
    if (alreadySet) return true

    await server.redis.set(key, '1', 'EX', ttlSeconds)
    return false
  } catch (error) {
    server.log.warn(
      { err: error },
      '[NOTIFICATIONS] Failed to set throttle key; not throttling',
    )
    return false
  }
}

const sendSessionMessageNotification = async (
  server: FastifyInstance,
  session: any,
  recipients: ObjectId[],
  senderId: ObjectId,
  content?: string,
) => {
  const uniqueRecipientIds = Array.from(
    new Set(
      recipients
        .filter(Boolean)
        .map(r => r.toString())
        .filter(id => id !== senderId.toString()),
    ),
  )

  if (uniqueRecipientIds.length === 0) return

  const title = session.title
    ? `New message in ${session.title}`
    : 'New session message'

  const snippet = content
    ? content.substring(0, 140) + (content.length > 140 ? '…' : '')
    : 'You have a new message'

  for (const recipientId of uniqueRecipientIds) {
    const userObjectId = new ObjectId(recipientId)

    // Skip if user is actively viewing the session
    const isActive = await isUserActiveInSession(
      server,
      userObjectId,
      session._id,
    )
    if (isActive) continue

    // Throttle frequent notifications per user/session
    const throttled = await shouldThrottleSessionMessageNotification(
      server,
      userObjectId,
      session._id,
    )
    if (throttled) continue

    const notification = new Notification({
      user: userObjectId,
      type: 'session_message',
      title,
      message: snippet,
      priority: 'normal',
      session: session._id,
      action_url: `/sessions/${session._id.toString()}`,
      channels: ['in_app', 'push'],
      delivered_channels: [],
    })

    // Mark in-app delivery immediately
    notification.delivered_channels.push('in_app')

    await notification.save()

    try {
      const deviceTokens = await DeviceToken.find({
        user: userObjectId,
        active: true,
      })

      if (deviceTokens.length) {
        const results = await Promise.allSettled(
          deviceTokens.map(token =>
            sendPushNotification(server, token.push_token, title, snippet, {
              notification_id: notification._id.toString(),
              type: 'session_message',
              session_id: session._id.toString(),
              action_url: `/sessions/${session._id.toString()}`,
            }),
          ),
        )

        const successful = results.filter(
          r => r.status === 'fulfilled' && r.value?.success,
        )
        if (successful.length) {
          notification.delivered_channels.push('push')
        }

        // Mark bad tokens inactive
        results.forEach((result, index) => {
          const token = deviceTokens[index]
          if (
            result.status === 'fulfilled' &&
            result.value?.error === 'Invalid push token'
          ) {
            token.active = false
            token.save().catch(() => null)
          }
        })
      }
    } catch (error) {
      server.log.error(
        { err: error },
        '[NOTIFICATIONS] Failed sending session_message push',
      )
      notification.delivery_failed_channels.push('push')
    }

    await notification.save()
  }
}

const canInteractWithPermission = (
  permission?: { level: SessionPermissionLevel } | null,
) => {
  return !!permission && INTERACTIVE_PERMISSION_LEVELS.has(permission.level)
}

const deliverSessionPermissionPush = async (
  server: FastifyInstance,
  notification: any,
) => {
  try {
    const tokens = await DeviceToken.find({
      user: notification.user,
      active: true,
    })
    if (!tokens.length) return

    const results = await Promise.allSettled(
      tokens.map(token =>
        sendPushNotification(
          server,
          token.push_token,
          notification.title,
          notification.message,
          {
            notification_id: notification._id.toString(),
            type: notification.type,
            session_id: notification.session?.toString(),
            action_url: notification.action_url,
          },
        ),
      ),
    )

    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value?.success,
    )
    if (successful.length) {
      notification.delivered_channels.push('push')
    }
    notification.delivery_attempted_at = new Date()
    await notification.save()
  } catch (error) {
    server.log.error(
      { err: error },
      '[NOTIFICATIONS] session permission push failed',
    )
    notification.delivery_failed_channels.push('push')
    notification.delivery_attempted_at = new Date()
    await notification.save()
  }
}

const mapPermissionLevel = (level: string): SessionPermissionLevel => {
  switch (level) {
    case SessionPermissionLevel.Owner:
    case 'owner':
      return SessionPermissionLevel.Owner
    case SessionPermissionLevel.Editor:
    case 'editor':
      return SessionPermissionLevel.Editor
    case SessionPermissionLevel.Participant:
    case 'participant':
      return SessionPermissionLevel.Participant
    case SessionPermissionLevel.Viewer:
    case 'viewer':
      return SessionPermissionLevel.Viewer
    default:
      throw new Error(`Invalid session permission level: ${level}`)
  }
}

const formatPermissionLabel = (level: SessionPermissionLevel) =>
  `${level.charAt(0).toUpperCase()}${level.slice(1)}`

const isUserInList = (list: any[] | undefined, userId: string) =>
  Array.isArray(list) &&
  list.some(user => {
    if (!user) return false
    if (typeof user === 'string') return user === userId
    if (user._id) return user._id.toString() === userId
    if (typeof user.toString === 'function') {
      return user.toString() === userId
    }
    return false
  })

export const createSession = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Body: SessionsV2CreateArguments }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const {
    agent_ids,
    context,
    budget,
    title,
    session_type: sessionType,
    status,
    settings,
    extras,
  } = request.body

  // Validation
  if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
    return reply.status(400).send({
      message: 'agent_ids must be a non-empty array',
    })
  }

  if (
    context !== undefined &&
    (typeof context !== 'string' || context.length > 5000)
  ) {
    return reply.status(400).send({
      message: 'context must be a string with max 5000 characters',
    })
  }

  // Updated budget validation
  if (budget !== undefined) {
    if (typeof budget !== 'object') {
      return reply.status(400).send({
        message: 'budget must be an object',
      })
    }

    if (
      budget.manna_budget !== undefined &&
      (typeof budget.manna_budget !== 'number' ||
        budget.manna_budget < 100 ||
        budget.manna_budget > 50000)
    ) {
      return reply.status(400).send({
        message: 'manna_budget must be a number between 100 and 50000',
      })
    }

    if (
      budget.token_budget !== undefined &&
      (typeof budget.token_budget !== 'number' ||
        budget.token_budget < 1000 ||
        budget.token_budget > 1000000)
    ) {
      return reply.status(400).send({
        message: 'token_budget must be a number between 1000 and 1000000',
      })
    }

    if (
      budget.turn_budget !== undefined &&
      (typeof budget.turn_budget !== 'number' ||
        budget.turn_budget < 1 ||
        budget.turn_budget > 1000)
    ) {
      return reply.status(400).send({
        message: 'turn_budget must be a number between 1 and 1000',
      })
    }
  }

  if (
    title !== undefined &&
    (typeof title !== 'string' || title.length > 1000)
  ) {
    return reply.status(400).send({
      message: 'title must be a string with max 1000 characters',
    })
  }

  // Validate type
  if (sessionType !== undefined && sessionType !== null) {
    if (
      typeof sessionType !== 'string' ||
      !['passive', 'natural', 'automatic'].includes(sessionType)
    ) {
      return reply.status(400).send({
        message: 'type must be "passive", "natural", or "automatic"',
      })
    }
  }

  // Validate settings
  if (settings !== undefined) {
    if (typeof settings !== 'object' || settings === null) {
      return reply.status(400).send({
        message: 'settings must be an object',
      })
    }

    const settingsObj = settings as {
      conductor_prompt?: string
      delay_interval?: number
      mention_force_reply?: boolean
    }

    if (
      settingsObj.conductor_prompt !== undefined &&
      (typeof settingsObj.conductor_prompt !== 'string' ||
        settingsObj.conductor_prompt.length > 2000)
    ) {
      return reply.status(400).send({
        message: 'conductor_prompt must be a string with max 2000 characters',
      })
    }

    if (
      settingsObj.delay_interval !== undefined &&
      (typeof settingsObj.delay_interval !== 'number' ||
        settingsObj.delay_interval < 0 ||
        settingsObj.delay_interval > 86400)
    ) {
      return reply.status(400).send({
        message: 'delay_interval must be a number between 0 and 86400',
      })
    }

    if (
      settingsObj.mention_force_reply !== undefined &&
      typeof settingsObj.mention_force_reply !== 'boolean'
    ) {
      return reply.status(400).send({
        message: 'mention_force_reply must be a boolean',
      })
    }
  }

  try {
    const userDocument = await User.findById(userId)
    if (!userDocument) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    // Validate that all agent IDs are valid ObjectIds
    const validAgentIds = agent_ids.map(id => {
      try {
        return new ObjectId(id)
      } catch (error) {
        throw new Error(`Invalid agent ID format: ${id}`)
      }
    })

    // Validate that all agents exist
    const existingAgents = await Agent.find({ _id: { $in: validAgentIds } })
    if (existingAgents.length !== validAgentIds.length) {
      return reply.status(400).send({
        message: 'One or more agent IDs do not exist',
      })
    }

    // Create the session
    const sessionData: any = {
      owner: userId,
      agents: validAgentIds,
      messages: [], // Keep empty array for backward compatibility
      title,
    }

    if (context) {
      sessionData.context = context
    }

    if (sessionType) {
      sessionData.session_type = sessionType
    }

    if (status) {
      sessionData.status = status
    } else if (sessionType === 'automatic') {
      // Default to 'paused' for automatic sessions
      sessionData.status = 'paused'
    }

    if (budget) {
      sessionData.budget = {
        token_budget: budget.token_budget,
        manna_budget: budget.manna_budget,
        turn_budget: budget.turn_budget,
        tokens_spent: 0,
        manna_spent: 0,
        turns_spent: 0,
      }
    }

    if (settings) {
      sessionData.settings = settings
    }

    if (extras) {
      sessionData.extras = extras
    }

    const session = new Session(sessionData)

    // Mark extras and settings as modified since they're nested types
    if (session.extras) {
      session.markModified('extras')
    }
    if (session.settings) {
      session.markModified('settings')
    }

    // Create an eden message for agent additions
    await createEdenMessage(session._id, 'agent_add', existingAgents)
    // No longer storing message IDs on session to avoid race conditions
    // session.messages.push(edenMessage.id)
    await session.save()

    // Populate the session with agent and owner data
    const populatedSession = await Session.findById(session._id)
      .populate({
        path: 'owner',
        select: '_id username userId userImage',
      })
      .populate({
        path: 'users',
        select: '_id username userImage',
      })
      .populate({
        path: 'agents',
        select: '_id username userImage name description',
      })

    if (!populatedSession) {
      return reply.status(500).send({
        message: 'Failed to retrieve created session',
      })
    }

    return reply.status(201).send({
      success: true,
      session: populatedSession,
    })
  } catch (error) {
    server.log.error({
      message: 'Failed to create session',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return reply.status(500).send({
      message:
        error instanceof Error ? error.message : 'Failed to create session',
    })
  }
}

export const createSessionMessage = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Body: SessionsV2MessageArguments & {
      stream?: boolean
      thinking?: boolean
      agent_ids?: string[]
      context?: string
      budget?: {
        manna_budget?: number
        token_budget?: number
        turn_budget?: number
      }
      title?: string
      session_type?: 'passive' | 'natural' | 'automatic'
      status?: 'active' | 'paused' | 'stopped' | 'archived'
      settings?: {
        conductor_prompt?: string
        delay_interval: number
        mention_force_reply: boolean
      }
      extras?: {
        incognito?: boolean
        is_public?: boolean
      }
    }
  }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const {
    session_id,
    content,
    attachments,
    stream,
    thinking,
    agent_ids,
    context,
    budget,
    title,
    session_type: sessionType,
    status,
    settings,
    extras,
  } = request.body

  let session: any = null
  let sessionId = session_id

  // If no session_id provided, create a new session
  if (!session_id) {
    if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
      return reply.status(400).send({
        message: 'agent_ids must be provided when creating a new session',
      })
    }

    // Validate agent IDs
    const validAgentIds = agent_ids.map(id => {
      try {
        return new ObjectId(id)
      } catch (error) {
        throw new Error(`Invalid agent ID format: ${id}`)
      }
    })

    // Validate that all agents exist
    const existingAgents = await Agent.find({ _id: { $in: validAgentIds } })
    if (existingAgents.length !== validAgentIds.length) {
      return reply.status(400).send({
        message: 'One or more agent IDs do not exist',
      })
    }

    // Create the session
    const sessionData: any = {
      owner: userId,
      agents: validAgentIds,
      messages: [], // Keep empty array for backward compatibility
      title,
    }

    if (context) {
      sessionData.context = context
    }

    if (sessionType) {
      sessionData.session_type = sessionType
      // Automatic sessions should start paused by default
      if (sessionType === 'automatic' && !status) {
        sessionData.status = 'paused'
      }
    }

    if (status) {
      sessionData.status = status
    }

    if (budget) {
      sessionData.budget = {
        token_budget: budget.token_budget,
        manna_budget: budget.manna_budget,
        turn_budget: budget.turn_budget,
        tokens_spent: 0,
        manna_spent: 0,
        turns_spent: 0,
      }
    }

    if (settings) {
      sessionData.settings = settings
    }

    if (extras) {
      sessionData.extras = extras
    }

    session = new Session(sessionData)

    // Mark extras and settings as modified since they're nested types
    if (session.extras) {
      session.markModified('extras')
    }
    if (session.settings) {
      session.markModified('settings')
    }

    // Create an eden message for agent additions
    await createEdenMessage(session._id, 'agent_add', existingAgents)
    // No longer storing message IDs on session to avoid race conditions
    // session.messages.push(edenMessage.id)
    await session.save()

    sessionId = session._id.toString()
  } else {
    // Find existing session
    const query = createIdOrSlugQuery(session_id)
    session = await Session.findOne(query)

    if (!session) {
      return reply.status(404).send({
        message: 'session not found',
      })
    }

    // Check if user has access to the session (owner, in users list, or has permission)
    const currentUserIdStr = userId.toString()
    const isOwner = session.owner.toString() === currentUserIdStr
    const isAllowedUser = isUserInList(session.users, currentUserIdStr)
    const permission = await SessionPermission.findOne({
      session: session._id,
      user: userId,
    })
    const hasInteractionPermission = canInteractWithPermission(permission)

    if (!isOwner && !isAllowedUser && !hasInteractionPermission) {
      return reply.status(403).send({
        message: 'You do not have access to this session',
      })
    }

    // For automatic sessions, set status to 'paused' when a new message is submitted
    if (session.session_type === 'automatic' && session.status !== 'paused') {
      session.status = 'paused'
      await session.save()
    }
  }

  const userDocument = await User.findById(userId)
  if (!userDocument) {
    return reply.status(404).send({
      message: `User not found`,
    })
  }

  const modalRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/sessions/prompt`,
    data: {
      session_id: sessionId,
      message: {
        content,
        attachments,
      },
      user_id: userId,
      stream: stream || false,
      // Include agent_ids from request body if provided (for multi-agent targeting)
      ...(agent_ids && { actor_agent_ids: agent_ids }),
      // Only include thinking override if explicitly provided
      ...(thinking !== undefined && { thinking }),
      // Include api_key_id if available
      ...(request.user?.apiKeyId && { api_key_id: request.user.apiKeyId }),
    },
    headers: {
      'X-Client-Platform': 'web',
      'X-Client-Deployment-Id': session.id,
    },
  }

  try {
    if (stream) {
      // Set up SSE headers for streaming
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      })

      // Immediately send session_id as first SSE message
      reply.raw.write(
        `data: ${JSON.stringify({
          event: 'session_created',
          data: { session_id: sessionId },
        })}\n\n`,
      )

      const response = await axios.post(
        modalRequest.endpoint,
        modalRequest.data,
        {
          headers: {
            Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
          },
          responseType: 'stream',
        },
      )

      // Pipe the stream from the compute API to the client
      response.data.on('data', (chunk: Buffer) => {
        reply.raw.write(chunk)
      })

      response.data.on('end', () => {
        reply.raw.end()
      })

      response.data.on('error', (error: Error) => {
        console.error('Stream error:', error)
        reply.raw.write(
          `data: ${JSON.stringify({
            event: 'error',
            data: { error: error.message },
          })}\n\n`,
        )
        reply.raw.end()
      })

      // Update user preferences with last agents (don't await to avoid blocking the stream)
      if (session.agents && session.agents.length > 0) {
        const userOid =
          userId instanceof mongoose.Types.ObjectId
            ? userId
            : new mongoose.Types.ObjectId(userId.toString())

        for (const agent of session.agents) {
          const agentOid =
            agent instanceof mongoose.Types.ObjectId
              ? agent
              : new mongoose.Types.ObjectId(agent.toString())

          UserPreferences.updateLastAgent(userOid, agentOid)
            .then(() => {})
            .catch(() => {})
        }
      }
    } else {
      // Non-streaming response
      const modalResponse = await axios.post(
        modalRequest.endpoint,
        modalRequest.data,
        {
          headers: {
            Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
          },
        },
      )

      if (!modalResponse?.data?.session_id) {
        return reply.status(500).send({
          message: `Missing session_id`,
        })
      }

      const message_id =
        modalResponse.data.message_id || modalResponse.data.messages?.[0]?.id

      // Determine recipients for session message notifications
      try {
        const permissions = await SessionPermission.find({
          session: session._id,
        })

        const interactivePermissionHolders = permissions
          .filter(p => canInteractWithPermission(p))
          .map(p => p.user as any as ObjectId)

        const recipientIds = [
          session.owner as any as ObjectId,
          ...(Array.isArray(session.users)
            ? (session.users as any as ObjectId[])
            : []),
          ...interactivePermissionHolders,
        ]

        await sendSessionMessageNotification(
          server,
          session,
          recipientIds,
          new ObjectId(userId),
          content,
        )
      } catch (notifyError) {
        server.log.error(
          { err: notifyError },
          '[NOTIFICATIONS] Failed to enqueue session message notification',
        )
      }

      // Update user preferences with last agents
      if (session.agents && session.agents.length > 0) {
        try {
          const userOid =
            userId instanceof mongoose.Types.ObjectId
              ? userId
              : new mongoose.Types.ObjectId(userId.toString())

          for (const agent of session.agents) {
            const agentOid =
              agent instanceof mongoose.Types.ObjectId
                ? agent
                : new mongoose.Types.ObjectId(agent.toString())

            await UserPreferences.updateLastAgent(userOid, agentOid)
          }
        } catch (err) {
          // Continue even if preference update fails
        }
      }

      return reply.status(200).send({
        session_id: modalResponse.data.session_id,
        message_id,
      })
    }
  } catch (e) {
    console.error('Error creating session message:', e)
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Unknown Error'

    if (stream) {
      reply.raw.write(
        `data: ${JSON.stringify({
          event: 'error',
          data: { error: errorMessage },
        })}\n\n`,
      )
      reply.raw.end()
    } else {
      return reply.status(500).send({ error: errorMessage })
    }
  }
}

export const listSessions = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Querystring: SessionsV2ListArguments }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(404).send({
      message: `User not found`,
    })
  }

  const { limit = 25, page, sort, agent_id } = request.query

  try {
    const queryOptions: QueryOptions = {
      select:
        '_id title name owner createdAt updatedAt trigger agents users pinned visible session_type parent_session platform',
      limit,
      page,
      sort: {
        ...sort,
        updatedAt: -1,
        createdAt: -1,
      },
      populate: [
        {
          path: 'agents',
          select: '_id username userImage name',
        },
        {
          path: 'users',
          select: '_id username userImage',
        },
        {
          path: 'owner',
          select: '_id username userImage',
        },
      ],
    }

    const userPermissions = await SessionPermission.find({ user: userId })
    const sharedSessionIds = userPermissions.map(p => p.session)
    const permissionLevelMap = new Map(
      userPermissions.map(p => [p.session.toString(), p.level]),
    )

    const sessionsRepository = new SessionRepository(Session)
    const sessionQuery: any = {
      $or: [{ owner: userId }, { users: userId }],
    }

    if (sharedSessionIds.length > 0) {
      sessionQuery.$or.push({ _id: { $in: sharedSessionIds } })
    }

    // Add agent filter if provided - look up agent by username first
    if (agent_id) {
      const agent = await Agent.findOne({ username: agent_id })
      if (!agent) {
        return reply.status(404).send({
          message: 'Agent not found',
        })
      }
      sessionQuery.agents = agent._id
    }

    const paginatedResponse = await sessionsRepository.query(
      sessionQuery,
      queryOptions,
    )

    const docsWithPermissionLevel = paginatedResponse.docs.map(doc => {
      const asObject = (doc as any)?.toObject ? (doc as any).toObject() : doc
      const level = permissionLevelMap.get(asObject._id.toString())
      if (level) {
        return {
          ...asObject,
          permission_level_for_user: level,
        }
      }
      return asObject
    })

    return reply.status(200).send({
      ...paginatedResponse,
      docs: docsWithPermissionLevel,
    })
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Unknown Error'

    server.log.error({
      message: 'Failed to list sessions',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}

export const getSession = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Params: { session_id: string }
    Querystring: { parent_session_id?: string }
  }>,
  reply: FastifyReply,
) => {
  const { userId, featureFlags } = request.user || {}

  const { session_id } = request.params
  const { parent_session_id } = request.query || {}
  const limit = 25 // Fixed limit for initial session load

  // Debug logging for child session access
  if (parent_session_id) {
    server.log.info({
      message: 'Child session access attempt',
      session_id,
      parent_session_id,
    })
  }

  try {
    const session = await Session.findOne({
      _id: new ObjectId(session_id as string),
    })
      .populate({
        path: 'owner',
        select: '_id username userId userImage',
      })
      .populate({
        path: 'users',
        select: '_id username userImage',
      })
      .populate({
        path: 'agents',
        select: '_id name username userImage owner',
        populate: {
          path: 'owner',
          select: '_id username userImage',
        },
      })

    if (!session) {
      return reply.status(404).send({
        message: 'Session not found',
      })
    }

    // Check if session is public
    const isPublicSession = session.extras?.is_public === true

    // Check if parent session is public and this is a child of that parent
    let parentIsPublicAndContainsChild = false
    if (parent_session_id && !isPublicSession) {
      try {
        const parentSession = await Session.findOne({
          _id: new ObjectId(parent_session_id),
        }).select('extras agent_sessions')

        server.log.info({
          message: 'Parent session lookup result',
          parentFound: !!parentSession,
          parentIsPublic: parentSession?.extras?.is_public,
          agentSessionsCount: parentSession?.agent_sessions
            ? Object.keys(parentSession.agent_sessions).length
            : 0,
        })

        if (parentSession?.extras?.is_public === true) {
          // Verify this session is in the parent's agent_sessions
          const agentSessions = parentSession.agent_sessions || {}
          const childSessionIds = Object.values(agentSessions).map(id =>
            id.toString(),
          )
          const isChildInParent = childSessionIds.includes(session_id)
          server.log.info({
            message: 'Child session check',
            session_id,
            childSessionIds,
            isChildInParent,
          })
          if (isChildInParent) {
            parentIsPublicAndContainsChild = true
          }
        }
      } catch (err) {
        server.log.error({
          message: 'Error checking parent session',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        // Invalid parent_session_id, continue with normal access check
      }
    }

    const requesterPermission = userId
      ? await SessionPermission.findOne({
          session: session._id,
          user: userId,
        })
      : null

    // If not authenticated, only allow access to public sessions or child sessions of public parents
    if (!userId) {
      if (!isPublicSession && !parentIsPublicAndContainsChild) {
        return reply.status(401).send({
          message: 'Authentication required to access this session',
        })
      }
      // Continue to fetch and return session for public access
    } else {
      // Check if user has access to the session (owner, in users list, has permission, is eden admin, session is public, or parent is public)
      const getSessionUserIdStr = userId.toString()
      const isSessionOwner =
        session.owner._id.toString() === getSessionUserIdStr
      const isSessionUser = isUserInList(session.users, getSessionUserIdStr)
      const hasPermission = !!requesterPermission
      const isEdenTeamMember = featureFlags?.includes(FeatureFlag.EdenAdmin)

      if (
        !isSessionOwner &&
        !isSessionUser &&
        !hasPermission &&
        !isEdenTeamMember &&
        !isPublicSession &&
        !parentIsPublicAndContainsChild
      ) {
        return reply.status(403).send({
          message:
            'You do not have access to this session. If you believe this is an error, ask the session owner to create a share link.',
        })
      }
    }

    // Fetch latest messages (no pagination on initial session fetch)
    // Fetch limit+1 to check if there are more
    // Filter out messages with no content, no tool_calls, and no attachments
    const fetchLimit = limit + 1
    const messages = await Message.find({
      session: session._id,
      $or: [
        { content: { $exists: true, $nin: ['', null] } },
        {
          $and: [
            { tool_calls: { $exists: true } },
            { tool_calls: { $ne: null } },
            { tool_calls: { $type: 'array' } },
            { tool_calls: { $not: { $size: 0 } } },
          ],
        },
        {
          $and: [
            { attachments: { $exists: true } },
            { attachments: { $ne: null } },
            { attachments: { $type: 'array' } },
            { attachments: { $not: { $size: 0 } } },
          ],
        },
        {
          $and: [
            { eden_message_data: { $exists: true } },
            { eden_message_data: { $ne: null } },
          ],
        },
      ],
    })
      .populate({
        path: 'sender',
        select: '_id username userImage name',
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(fetchLimit)
      .select(
        '_id content sender role eden_message_data tool_calls thought attachments createdAt reactions llm_call',
      )

    // Take up to limit messages (we fetched limit+1 to check if there are more)
    const paginatedMessages =
      messages.length > limit
        ? messages.slice(0, limit).reverse()
        : messages.reverse()

    // Check if there are more messages by looking for ANY message older than our oldest
    // This fixes a bug where gaps of filtered-out messages would cause hasMore to be false prematurely
    let hasMore = false
    let nextCursor: string | undefined

    if (paginatedMessages.length > 0) {
      const oldestMessage = paginatedMessages[0]
      const createdAt = oldestMessage.createdAt || new Date()

      // Check if any message exists older than the oldest we're returning
      const olderMessageCount = await Message.countDocuments({
        session: session._id,
        $or: [
          { createdAt: { $lt: createdAt } },
          {
            createdAt: createdAt,
            _id: { $lt: oldestMessage._id },
          },
        ],
      }).limit(1)

      hasMore = olderMessageCount > 0

      if (hasMore) {
        const cursorString = `${createdAt.toISOString()}_${oldestMessage._id}`
        nextCursor = Buffer.from(cursorString).toString('base64')
      }
    }

    // Fetch permissions for the session
    const permissions = await SessionPermission.find({
      session: session._id,
    }).populate({
      path: 'user',
      select: '_id username userImage',
    })

    // Add messages and permissions to the session object
    const permissionLevelForUser =
      requesterPermission?.level ||
      (userId && session.owner._id.toString() === userId.toString()
        ? SessionPermissionLevel.Owner
        : undefined)

    const sessionWithPermissions = {
      ...session.toObject(),
      messages: paginatedMessages,
      permissions,
      permission_level_for_user: permissionLevelForUser,
    }

    return reply.status(200).send({
      session: sessionWithPermissions,
      nextCursor,
      hasMore,
    })
  } catch (e) {
    const error = e as Error & { response?: { data?: string } }
    const errorMessage =
      error?.response?.data ||
      error?.message ||
      (typeof e === 'string' ? e : 'Unknown Error')

    server.log.error({
      message: 'Failed to get session',
      session_id,
      parent_session_id,
      error: errorMessage,
      stack: error?.stack,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}

export const getSessionMessages = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Params: { session_id: string }
    Querystring: { cursor?: string; limit?: string }
  }>,
  reply: FastifyReply,
) => {
  const { userId, featureFlags } = request.user || {}

  const { session_id } = request.params
  const { cursor, limit: limitStr } = request.query
  const limit = limitStr ? parseInt(limitStr, 10) : 25

  try {
    // Verify session exists and user has access
    const session = await Session.findOne({
      _id: new ObjectId(session_id as string),
    })

    if (!session) {
      return reply.status(404).send({
        message: 'Session not found',
      })
    }

    // Check if session is public
    const isPublicSession = session.extras?.is_public === true

    const requesterPermission = userId
      ? await SessionPermission.findOne({
          session: session._id,
          user: userId,
        })
      : null

    // If not authenticated, only allow access to public sessions
    if (!userId) {
      if (!isPublicSession) {
        return reply.status(401).send({
          message: 'Authentication required to access this session',
        })
      }
      // Continue to fetch and return messages for public access
    } else {
      // Check access (owner, in users list, has permission, is eden admin, or session is public)
      const userIdStr = userId.toString()
      const isOwner = session.owner.toString() === userIdStr
      const isUser = isUserInList(session.users, userIdStr)
      const hasPermission = !!requesterPermission
      const isEdenTeamMember = featureFlags?.includes(FeatureFlag.EdenAdmin)

      if (
        !isOwner &&
        !isUser &&
        !hasPermission &&
        !isEdenTeamMember &&
        !isPublicSession
      ) {
        return reply.status(403).send({
          message: 'You do not have access to this session',
        })
      }
    }

    // Build query for cursor-based pagination
    // Filter out messages with no content, no tool_calls, no attachments, and no eden_message_data
    // Note: eden_message_data condition must match getSession query to include conductor messages
    const messageQuery: any = {
      session: session._id,
      $or: [
        { content: { $exists: true, $nin: ['', null] } },
        {
          $and: [
            { tool_calls: { $exists: true } },
            { tool_calls: { $ne: null } },
            { tool_calls: { $type: 'array' } },
            { tool_calls: { $not: { $size: 0 } } },
          ],
        },
        {
          $and: [
            { attachments: { $exists: true } },
            { attachments: { $ne: null } },
            { attachments: { $type: 'array' } },
            { attachments: { $not: { $size: 0 } } },
          ],
        },
        {
          $and: [
            { eden_message_data: { $exists: true } },
            { eden_message_data: { $ne: null } },
          ],
        },
      ],
    }

    if (cursor) {
      try {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8')
        const [cursorCreatedAt, cursorId] = decodedCursor.split('_')

        // Find messages older than the cursor
        // Combine with content filter using $and
        messageQuery.$and = [
          {
            $or: [
              { createdAt: { $lt: new Date(cursorCreatedAt) } },
              {
                createdAt: new Date(cursorCreatedAt),
                _id: { $lt: new ObjectId(cursorId) },
              },
            ],
          },
        ]
      } catch (error) {
        return reply.status(400).send({
          message: 'Invalid cursor format',
        })
      }
    }

    // Fetch messages older than cursor (or latest if no cursor)
    const fetchLimit = limit + 1
    const messages = await Message.find(messageQuery)
      .populate({
        path: 'sender',
        select: '_id username userImage name',
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(fetchLimit)
      .select(
        '_id content sender role eden_message_data tool_calls thought attachments createdAt reactions llm_call',
      )

    // Take up to limit messages (we fetched limit+1 to check if there are more)
    const paginatedMessages =
      messages.length > limit
        ? messages.slice(0, limit).reverse()
        : messages.reverse()

    // Check if there are more messages by looking for ANY message older than our oldest
    // This fixes a bug where gaps of filtered-out messages would cause hasMore to be false prematurely
    let hasMore = false
    let nextCursor: string | undefined

    if (paginatedMessages.length > 0) {
      const oldestMessage = paginatedMessages[0]
      const createdAt = oldestMessage.createdAt || new Date()

      // Check if any message exists older than the oldest we're returning
      // Use countDocuments with limit 1 for efficiency (we only need to know if at least one exists)
      const olderMessageCount = await Message.countDocuments({
        session: session._id,
        $or: [
          { createdAt: { $lt: createdAt } },
          {
            createdAt: createdAt,
            _id: { $lt: oldestMessage._id },
          },
        ],
      }).limit(1)

      hasMore = olderMessageCount > 0

      if (hasMore) {
        const cursorString = `${createdAt.toISOString()}_${oldestMessage._id}`
        nextCursor = Buffer.from(cursorString).toString('base64')
      }
    }

    return reply.status(200).send({
      messages: paginatedMessages,
      hasMore,
      nextCursor,
    })
  } catch (e) {
    const error = e as Error & { response?: { data?: string } }
    const errorMessage =
      error?.response?.data ||
      error?.message ||
      (typeof e === 'string' ? e : 'Unknown Error')

    server.log.error({
      message: 'Failed to get session messages',
      session_id,
      error: errorMessage,
      stack: error?.stack,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}

export const addSessionMessageReaction = async (
  request: FastifyRequest<{ Body: SessionsV2MessageReactArguments }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { message_id, reaction } = request.body

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  if (!message_id) {
    return reply.status(400).send({
      message: 'message_id not provided',
    })
  }

  if (!reaction) {
    return reply.status(400).send({
      message: 'reaction not provided',
    })
  }

  const message = await Message.findOne({
    _id: new ObjectId(message_id as string),
  })

  if (!message) {
    return reply.status(404).send({
      message: 'Message not found',
    })
  }

  // Find a session the user might have access to (message can belong to multiple sessions)
  const session = await Session.findOne({
    _id: { $in: message.session },
  })

  if (!session) {
    return reply.status(404).send({
      message: 'Session not found',
    })
  }

  // Check if user has access to the session (owner, in users list, or has permission)
  const reactionUserIdStr = userId.toString()
  const isSessionOwner = session.owner.toString() === reactionUserIdStr
  const isSessionUser = isUserInList(session.users, reactionUserIdStr)
  const permission = await SessionPermission.findOne({
    session: session._id,
    user: userId,
  })
  const hasInteractionPermission = canInteractWithPermission(permission)

  if (!isSessionOwner && !isSessionUser && !hasInteractionPermission) {
    return reply.status(403).send({
      message: 'You do not have access to this session',
    })
  }

  // Initialize reactions if it doesn't exist or convert from array format
  // Eve backend stores: [{ user_id, reaction }, ...]
  // Eden API expects: { [userId]: [reactions...] }
  if (!message.reactions) {
    message.reactions = {}
  } else if (Array.isArray(message.reactions)) {
    // Convert array format to dictionary format
    const dictReactions: Record<string, string[]> = {}
    for (const r of message.reactions as Array<{
      user_id: string | { toString(): string }
      reaction: string
    }>) {
      const rUserId =
        typeof r.user_id === 'object' ? r.user_id.toString() : r.user_id
      if (!dictReactions[rUserId]) {
        dictReactions[rUserId] = []
      }
      if (!dictReactions[rUserId].includes(r.reaction)) {
        dictReactions[rUserId].push(r.reaction)
      }
    }
    message.reactions = dictReactions
  }

  const userIdStr = userId.toString()
  const existingReactions = message.reactions[userIdStr] || []

  // Handle reaction toggle
  if (existingReactions.includes(reaction)) {
    // Remove the reaction if it exists
    message.reactions[userIdStr] = existingReactions.filter(r => r !== reaction)
  } else {
    // Add the reaction if it doesn't exist
    let newReactions = [...existingReactions, reaction]

    // Handle mutually exclusive thumbs up/down
    if (reaction === 'thumbs_up') {
      newReactions = newReactions.filter(r => r !== 'thumbs_down')
    } else if (reaction === 'thumbs_down') {
      newReactions = newReactions.filter(r => r !== 'thumbs_up')
    }

    message.reactions[userIdStr] = newReactions
  }

  // If the user has no reactions left, remove their entry
  if (message.reactions[userIdStr].length === 0) {
    delete message.reactions[userIdStr]
  }

  // Use markModified to ensure Mongoose knows the mixed type field was changed
  message.markModified('reactions')
  await message.save()

  return reply.status(200).send({ success: true, message })
}

export const addSessionToolCallReaction = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Body: SessionsV2ToolCallReactArguments }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { message_id, tool_call_id, reaction } = request.body

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  if (!message_id) {
    return reply.status(400).send({
      message: 'message_id not provided',
    })
  }

  if (!tool_call_id) {
    return reply.status(400).send({
      message: 'tool_call_id not provided',
    })
  }

  const message = await Message.findOne({
    _id: new ObjectId(message_id as string),
  })

  if (!message) {
    return reply.status(404).send({
      message: 'Message not found',
    })
  }

  // Find a session the user might have access to (message can belong to multiple sessions)
  const session = await Session.findOne({
    _id: { $in: message.session },
  })

  if (!session) {
    return reply.status(404).send({
      message: 'Session not found',
    })
  }

  // Check if user has access to the session (owner, in users list, or has permission)
  const reactionUserIdStr = userId.toString()
  const isSessionOwner = session.owner.toString() === reactionUserIdStr
  const isSessionUser = isUserInList(session.users, reactionUserIdStr)
  const permission = await SessionPermission.findOne({
    session: session._id,
    user: userId,
  })
  const hasInteractionPermission = canInteractWithPermission(permission)

  if (!isSessionOwner && !isSessionUser && !hasInteractionPermission) {
    return reply.status(403).send({
      message: 'You do not have access to this session',
    })
  }

  // Find the tool_call in the message
  if (!message.tool_calls || !Array.isArray(message.tool_calls)) {
    return reply.status(404).send({
      message: 'Message has no tool calls',
    })
  }

  const toolCallIndex = message.tool_calls.findIndex(
    (tc: any) => tc.id === tool_call_id,
  )

  if (toolCallIndex === -1) {
    return reply.status(404).send({
      message: 'Tool call not found in message',
    })
  }

  // Initialize reactions array if it doesn't exist or isn't an array
  if (
    !message.tool_calls[toolCallIndex].reactions ||
    !Array.isArray(message.tool_calls[toolCallIndex].reactions)
  ) {
    message.tool_calls[toolCallIndex].reactions = []
  }

  const userIdStr = userId.toString()
  const reactionsArray = message.tool_calls[toolCallIndex].reactions as any[]
  const existingReactionIndex = reactionsArray.findIndex(
    (r: any) => r.user_id === userIdStr,
  )

  if (existingReactionIndex !== -1) {
    // Update existing reaction
    reactionsArray[existingReactionIndex] = {
      user_id: userIdStr,
      reaction: reaction,
      createdAt: new Date(),
    }
  } else {
    // Add new reaction
    reactionsArray.push({
      user_id: userIdStr,
      reaction: reaction,
      createdAt: new Date(),
    })
  }
  message.tool_calls[toolCallIndex].reactions = reactionsArray

  // Use markModified to ensure Mongoose knows the mixed type field was changed
  message.markModified('tool_calls')
  await message.save()

  // Call compute API to process the reaction
  try {
    await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/reaction`,
      {
        message_id: message_id,
        tool_call_id: tool_call_id,
        reaction: reaction,
        user_id: userIdStr,
      },
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )
  } catch (error) {
    // Log error but don't fail the request - the reaction was saved locally
    console.error('Failed to send reaction to compute API:', error)
  }

  return reply.status(200).send({ success: true, message })
}

export const deleteSession = async (
  request: FastifyRequest<{ Params: SessionsV2DeleteArguments }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      error: 'User missing from request',
    })
  }

  const { session_id } = request.params

  const session = await Session.findOne({
    _id: new ObjectId(session_id as string),
  })

  if (!session || session.deleted) {
    return reply.status(404).send({
      error: 'Session not found',
    })
  }

  // Check if user is owner or has editor/owner permissions
  const isOwner = session.owner.toString() === userId.toString()
  if (!isOwner) {
    // Check for Editor or Owner permission
    const permission = await SessionPermission.findOne({
      session: session._id,
      user: userId,
      level: {
        $in: [SessionPermissionLevel.Editor, SessionPermissionLevel.Owner],
      },
    })

    if (!permission) {
      return reply.status(401).send({
        error: 'You are not allowed to delete this session',
      })
    }
  }

  await session.delete()

  return reply.status(200).send({ success: true })
}

export const renameSession = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Params: Pick<SessionsV2RenameArguments, 'session_id'>
    Body: Omit<SessionsV2RenameArguments, 'session_id'>
  }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      error: 'User missing from request',
    })
  }

  const { session_id } = request.params
  const {
    title,
    pinned,
    extras,
    agent_ids,
    session_type: sessionType,
    settings,
    context,
    budget,
    status,
  } = request.body

  if (
    title === undefined &&
    pinned === undefined &&
    extras === undefined &&
    agent_ids === undefined &&
    sessionType === undefined &&
    settings === undefined &&
    context === undefined &&
    budget === undefined &&
    status === undefined
  ) {
    return reply.status(400).send({
      error: 'At least one field must be provided to update',
    })
  }

  const session = await Session.findOne({
    _id: new ObjectId(session_id as string),
  })

  if (!session || session.deleted) {
    return reply.status(404).send({
      error: 'Session not found',
    })
  }

  // Check if user is owner or has editor/owner permissions
  const isOwner = session.owner.toString() === userId.toString()
  if (!isOwner) {
    // Check for Editor or Owner permission
    const permission = await SessionPermission.findOne({
      session: session._id,
      user: userId,
      level: {
        $in: [SessionPermissionLevel.Editor, SessionPermissionLevel.Owner],
      },
    })

    if (!permission) {
      return reply.status(401).send({
        error: 'You are not allowed to modify this session',
      })
    }
  }

  const updateData: any = {}
  if (title !== undefined) {
    updateData.title = title
  }
  if (pinned !== undefined) {
    updateData.pinned = pinned
  }
  if (extras !== undefined) {
    // Merge with existing extras to preserve other fields
    updateData.extras = {
      ...session.extras,
      ...extras,
    }
  }
  if (
    agent_ids !== undefined &&
    agent_ids !== null &&
    Array.isArray(agent_ids)
  ) {
    updateData.agents = agent_ids.map((id: string) => new ObjectId(id))
  }
  if (sessionType !== undefined) {
    updateData.session_type = sessionType
  }
  if (settings !== undefined) {
    updateData.settings = settings
  }
  if (context !== undefined) {
    updateData.context = context
  }
  if (budget !== undefined) {
    updateData.budget = {
      ...session.budget,
      ...budget,
    }
  }

  // Update local fields if any
  if (Object.keys(updateData).length > 0) {
    await session.updateOne({
      $set: updateData,
    })
  }

  // For status changes, forward to compute API instead of saving directly
  // For play (active), just hit the endpoint without status - compute will handle it
  // For pause, include status in the payload
  if (status !== undefined) {
    try {
      const payload: { session_id: string; status?: string } = {
        session_id: session_id as string,
      }
      if (status !== 'active') {
        payload.status = status as string
      }
      await axios.post(
        `${server.config.EDEN_COMPUTE_API_URL}/sessions/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
          },
        },
      )
    } catch (error) {
      console.error('Error forwarding status to compute API:', error)
      // Don't fail the whole request if compute API fails
    }
  }

  return reply.status(200).send({ success: true })
}

export const cancelSession = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Params: { session_id: string }
    Body?: {
      tool_call_id?: string
      tool_call_index?: number
    }
  }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      error: 'User missing from request',
    })
  }

  const { session_id } = request.params

  const session = await Session.findOne({
    _id: new ObjectId(session_id as string),
  })

  if (!session || session.deleted) {
    return reply.status(404).send({
      error: 'Session not found',
    })
  }

  // Check if user is owner or has editor/owner permissions
  const isOwner = session.owner.toString() === userId.toString()
  if (!isOwner) {
    // Check for Editor or Owner permission
    const permission = await SessionPermission.findOne({
      session: session._id,
      user: userId,
      level: {
        $in: [SessionPermissionLevel.Editor, SessionPermissionLevel.Owner],
      },
    })

    if (!permission) {
      return reply.status(401).send({
        error: 'You are not allowed to cancel this session',
      })
    }
  }

  try {
    // Send cancel request to the Python API
    const modalRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/sessions/cancel`,
      data: {
        session_id,
        user_id: userId,
        ...(request.body?.tool_call_id && {
          tool_call_id: request.body.tool_call_id,
        }),
        ...(request.body?.tool_call_index !== undefined && {
          tool_call_index: request.body.tool_call_index,
        }),
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

    return reply.status(200).send({
      status: modalResponse.data.status || 'cancel_signal_sent',
      session_id,
    })
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Failed to cancel session'
    return reply.status(500).send({ error: errorMessage })
  }
}

export const createSessionShare = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Params: { session_id: string }
    Body: { message_id: string; title?: string }
  }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      error: 'User missing from request',
    })
  }

  const { session_id } = request.params
  const { message_id, title } = request.body

  if (!message_id) {
    return reply.status(400).send({
      error: 'message_id is required',
    })
  }

  if (title && (typeof title !== 'string' || title.length > 200)) {
    return reply.status(400).send({
      error: 'title must be a string with max 200 characters',
    })
  }

  try {
    // Find the session and verify ownership
    const session = await Session.findOne({
      _id: new ObjectId(session_id),
    })

    if (!session) {
      return reply.status(404).send({
        error: 'Session not found',
      })
    }

    // Check if user is owner or has editor/owner permissions
    const isOwner = session.owner.toString() === userId.toString()
    if (!isOwner) {
      // Check for Editor or Owner permission
      const permission = await SessionPermission.findOne({
        session: session._id,
        user: userId,
        level: {
          $in: [SessionPermissionLevel.Editor, SessionPermissionLevel.Owner],
        },
      })

      if (!permission) {
        return reply.status(403).send({
          error: 'Only session owner or editors can create shares',
        })
      }
    }

    // Verify the message exists and belongs to this session
    const message = await Message.findOne({
      _id: new ObjectId(message_id),
      session: session._id,
    })

    if (!message) {
      return reply.status(404).send({
        error: 'Message not found in this session',
      })
    }

    // Create the share
    const sessionShare = new SessionShare({
      session: session._id,
      owner: userId,
      message_id: new ObjectId(message_id),
      title: title || undefined,
    })

    await sessionShare.save()

    // Create shares for any agent_sessions (child/workspace sessions)
    if (
      session.agent_sessions &&
      typeof session.agent_sessions === 'object' &&
      Object.keys(session.agent_sessions).length > 0
    ) {
      const childSharesMap: Record<string, string> = {}

      for (const [agentId, childSessionId] of Object.entries(
        session.agent_sessions,
      )) {
        if (!childSessionId) continue

        try {
          // Get the last message from the child session to use as message_id
          const lastChildMessage = await Message.findOne({
            session: new ObjectId(childSessionId.toString()),
          })
            .sort({ createdAt: -1 })
            .select('_id')

          if (lastChildMessage) {
            const childShare = new SessionShare({
              session: new ObjectId(childSessionId.toString()),
              owner: userId,
              message_id: lastChildMessage._id,
              title: title ? `${title} - Workspace` : undefined,
              parent_share: sessionShare._id,
            })

            await childShare.save()
            childSharesMap[agentId] = childShare._id.toString()
          }
        } catch (childError) {
          // Log but don't fail the whole operation if a child share fails
          server.log.warn({
            message: 'Failed to create child share for agent session',
            agentId,
            childSessionId: childSessionId.toString(),
            error:
              childError instanceof Error
                ? childError.message
                : 'Unknown error',
          })
        }
      }

      // Update the parent share with child_shares mapping
      if (Object.keys(childSharesMap).length > 0) {
        await SessionShare.findByIdAndUpdate(sessionShare._id, {
          child_shares: childSharesMap,
        })
      }
    }

    return reply.status(201).send({
      success: true,
      share_id: sessionShare._id.toString(),
      share_url: `/sessions/share/${sessionShare._id.toString()}`,
    })
  } catch (error) {
    server.log.error({
      message: 'Failed to create session share',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return reply.status(500).send({
      error: 'Failed to create session share',
    })
  }
}

export const getSharedSession = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Params: { share_id: string } }>,
  reply: FastifyReply,
) => {
  const { share_id } = request.params

  try {
    // Find the share by ObjectId
    const sessionShare = await SessionShare.findById(share_id)
      .populate({
        path: 'session',
        select:
          '_id title context agents session_type agent_sessions createdAt',
        populate: [
          {
            path: 'agents',
            select: '_id username userImage name description',
          },
        ],
      })
      .populate({
        path: 'owner',
        select: '_id username userImage',
      })
      .lean()

    if (!sessionShare) {
      return reply.status(404).send({
        error: 'Shared session not found',
      })
    }

    // Get messages up to the shared message (inclusive)
    const messages = await Message.find({
      session: sessionShare.session._id,
      createdAt: {
        $lte: (await Message.findById(sessionShare.message_id))?.createdAt,
      },
    })
      .populate({
        path: 'sender',
        select: '_id username userImage name',
      })
      .sort({ createdAt: 1 })
      .select(
        '_id content sender role eden_message_data tool_calls thought attachments createdAt llm_call',
      )

    return reply.status(200).send({
      share: {
        share_id: sessionShare._id.toString(),
        title: sessionShare.title,
        session: sessionShare.session,
        messages,
        owner: sessionShare.owner,
        createdAt: sessionShare.createdAt,
        child_shares: sessionShare.child_shares,
      },
    })
  } catch (error) {
    server.log.error({
      message: 'Failed to get shared session',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return reply.status(500).send({
      error: 'Failed to get shared session',
    })
  }
}

export const deleteSessionShare = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Params: { share_id: string } }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      error: 'User missing from request',
    })
  }

  const { share_id } = request.params

  try {
    const sessionShare = await SessionShare.findById(share_id)

    if (!sessionShare) {
      return reply.status(404).send({
        error: 'Share not found',
      })
    }

    if (sessionShare.owner.toString() !== userId.toString()) {
      return reply.status(403).send({
        error: 'Only share owner can delete this share',
      })
    }

    await sessionShare.delete()

    return reply.status(200).send({
      success: true,
    })
  } catch (error) {
    server.log.error({
      message: 'Failed to delete session share',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return reply.status(500).send({
      error: 'Failed to delete session share',
    })
  }
}

export const listUserShares = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      error: 'User missing from request',
    })
  }

  try {
    const shares = await SessionShare.find({ owner: userId })
      .populate({
        path: 'session',
        select: '_id title context createdAt',
      })
      .sort({ createdAt: -1 })
      .select('_id session title message_id createdAt')

    return reply.status(200).send({
      shares,
    })
  } catch (error) {
    server.log.error({
      message: 'Failed to list user shares',
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return reply.status(500).send({
      error: 'Failed to list user shares',
    })
  }
}

export const streamSession = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Params: { session_id: string } }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { session_id } = request.params

  try {
    const session = await Session.findOne({
      _id: new ObjectId(session_id as string),
    })

    if (!session || session.deleted) {
      return reply.status(404).send({
        message: 'Session not found',
      })
    }

    const currentUserIdStr = userId.toString()
    const isOwner = session.owner.toString() === currentUserIdStr
    const isAllowedUser = isUserInList(session.users, currentUserIdStr)
    const permission = await SessionPermission.findOne({
      session: session._id,
      user: userId,
    })

    if (!isOwner && !isAllowedUser && !permission) {
      return reply.status(403).send({
        message: 'You do not have access to this session',
      })
    }

    reply.hijack()
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    })

    const streamUrl = `${server.config.EDEN_COMPUTE_API_URL}/sessions/${session_id}/stream`

    const response = await axios.get(streamUrl, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
      responseType: 'stream',
    })

    response.data.on('data', (chunk: Buffer) => {
      reply.raw.write(chunk)
    })

    response.data.on('end', () => {
      reply.raw.end()
    })

    response.data.on('error', (error: Error) => {
      console.error('Stream error:', error)
      if (!reply.raw.writableEnded) {
        reply.raw.write(
          `data: ${JSON.stringify({
            event: 'error',
            error: error.message,
          })}\n\n`,
        )
        reply.raw.end()
      }
    })

    request.raw.on('close', () => {
      response.data.destroy()
    })
  } catch (e) {
    const error = e as any
    const statusCode = error?.response?.status || 500
    const errorData = error?.response?.data
    const errorMessage = error?.message || 'Failed to establish stream'

    server.log.error({
      message: '[Session Stream] Connection failed',
      sessionId: session_id,
      url: `${server.config.EDEN_COMPUTE_API_URL}/sessions/${session_id}/stream`,
      statusCode,
      error: errorMessage,
      responseData: errorData,
    })

    if (!reply.sent && !reply.raw.headersSent) {
      return reply.status(statusCode).send({
        error: `Stream connection failed: ${errorMessage}`,
        details: errorData,
      })
    } else {
      reply.raw.write(
        `data: ${JSON.stringify({
          event: 'error',
          error: `Stream connection failed: ${errorMessage}`,
        })}\n\n`,
      )
      reply.raw.end()
    }
  }
}

const hasOwnerPermissions = async (
  sessionId: string,
  userId: string,
): Promise<boolean> => {
  const session = await Session.findById(sessionId)
  if (!session) return false

  if (session.owner.toString() === userId) {
    return true
  }

  // Check for Owner or Editor permission
  const permission = await SessionPermission.findOne({
    session: sessionId,
    user: userId,
    level: {
      $in: [SessionPermissionLevel.Owner, SessionPermissionLevel.Editor],
    },
  })

  return !!permission
}

export const getSessionPermissions = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { session_id } = request.params as { session_id: string }
  const currentUserId = request.user.userId

  const session = await Session.findById(session_id)
  if (!session) {
    return reply.status(404).send({ error: 'Session not found' })
  }

  if (!(await hasOwnerPermissions(session_id, currentUserId.toString()))) {
    return reply.status(401).send({
      error: 'Only session owners can view permissions',
    })
  }

  try {
    const permissions = await SessionPermission.find({
      session: session_id,
    }).populate('user', '_id userId username userImage')

    return reply.status(200).send({ permissions })
  } catch (error) {
    console.error('Error fetching session permissions:', error)
    return reply.status(500).send({
      error: 'Failed to fetch permissions',
    })
  }
}

export const updateSessionPermissions = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { session_id } = request.params as { session_id: string }
  const { permissions } = request.body as {
    permissions: Array<{
      username: string
      level: 'editor' | 'owner' | 'participant' | 'viewer'
    }>
  }
  const currentUserId = request.user.userId

  const session = await Session.findById(session_id)
  if (!session) {
    return reply.status(404).send({ error: 'Session not found' })
  }

  if (!(await hasOwnerPermissions(session_id, currentUserId.toString()))) {
    return reply.status(401).send({
      error: 'Only session owners can modify permissions',
    })
  }

  try {
    const existingPermissions = await SessionPermission.find({
      session: session_id,
    }).populate('user', 'username')

    const existingUserMap = new Map(
      existingPermissions.map(p => [
        (p.user as any).username,
        p.level as SessionPermissionLevel,
      ]),
    )

    const validatedPermissions: Array<{
      user: any
      username: string
      level: SessionPermissionLevel
    }> = []

    for (const perm of permissions || []) {
      let mappedLevel: SessionPermissionLevel
      try {
        mappedLevel = mapPermissionLevel(perm.level)
      } catch (err) {
        return reply.status(400).send({
          error: err instanceof Error ? err.message : String(err),
        })
      }

      const query = createMultiFieldQuery(perm.username, ['userId', 'username'])
      const user = await User.findOne(query)

      if (!user) {
        return reply.status(404).send({
          error: `User not found: ${perm.username}`,
        })
      }

      validatedPermissions.push({
        user,
        username: perm.username,
        level: mappedLevel,
      })
    }

    await SessionPermission.deleteMany({ session: session_id })

    const newPermissions: Array<{
      permission: SessionPermissionDocument
      user: any
      username: string
      level: SessionPermissionLevel
    }> = []

    for (const perm of validatedPermissions) {
      const newPermission = await SessionPermission.create({
        session: session_id,
        user: perm.user._id,
        level: perm.level,
        grantedBy: currentUserId,
        grantedAt: new Date(),
      })

      newPermissions.push({
        permission: newPermission,
        user: perm.user,
        username: perm.username,
        level: perm.level,
      })

      const existingLevel = existingUserMap.get(perm.username)
      const levelLabel = formatPermissionLabel(perm.level)
      if (!existingLevel) {
        const notification = await Notification.create({
          user: perm.user._id,
          type: 'session_permission_added',
          title: 'Session Permission Added',
          message: `You've been granted ${levelLabel} access to the session "${
            session.title || 'Untitled Session'
          }".`,
          priority: 'normal',
          action_url: `/sessions/${session_id}`,
          channels: ['in_app', 'push'],
        })
        await deliverSessionPermissionPush(server, notification)
      } else if (existingLevel !== perm.level) {
        const notification = await Notification.create({
          user: perm.user._id,
          type: 'session_permission_added',
          title: 'Session Permission Updated',
          message: `Your access to the session "${
            session.title || 'Untitled Session'
          }" has been changed to ${levelLabel}.`,
          priority: 'normal',
          action_url: `/sessions/${session_id}`,
          channels: ['in_app', 'push'],
        })
        await deliverSessionPermissionPush(server, notification)
      }
    }

    const newUserMap = new Map(newPermissions.map(p => [p.username, p.level]))

    for (const [username, _] of existingUserMap) {
      if (!newUserMap.has(username)) {
        const removedUser = await User.findOne(
          createMultiFieldQuery(username, ['userId', 'username']),
        )
        if (removedUser) {
          const notification = await Notification.create({
            user: removedUser._id,
            type: 'session_permission_removed',
            title: 'Session Permission Removed',
            message: `Your access to the session "${
              session.title || 'Untitled Session'
            }" has been removed.`,
            priority: 'normal',
            action_url: `/sessions`,
            channels: ['in_app', 'push'],
          })
          await deliverSessionPermissionPush(server, notification)
        }
      }
    }

    return reply.status(200).send({ success: true })
  } catch (error) {
    console.error('Error updating session permissions:', error)
    return reply.status(500).send({
      error: 'Failed to update permissions',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

export const getSharedSessions = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const currentUserId = request.user.userId

  try {
    const permissions = await SessionPermission.find({
      user: currentUserId,
    }).populate({
      path: 'session',
      populate: [
        {
          path: 'owner',
          select: '_id userId username userImage type',
        },
        {
          path: 'agents',
          select: '_id username name userImage type',
        },
      ],
    })

    const sharedSessions = permissions
      .filter(p => p.session)
      .map(p => ({
        session: p.session,
        permissionLevel: p.level,
        grantedAt: p.grantedAt,
      }))

    return reply.status(200).send({ sharedSessions })
  } catch (error) {
    console.error('Error fetching shared sessions:', error)
    return reply.status(500).send({
      error: 'Failed to fetch shared sessions',
    })
  }
}

export const updateSessionStatus = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { session_id, status } = request.body as {
    session_id: string
    status: string
  }
  const currentUserId = request.user.userId

  if (!session_id) {
    return reply.status(400).send({
      message: 'Missing session_id',
    })
  }

  if (
    !status ||
    !['active', 'paused', 'stopped', 'archived'].includes(status)
  ) {
    return reply.status(400).send({
      message: 'status must be "active", "paused", "stopped", or "archived"',
    })
  }

  try {
    // First, get the session to check ownership
    const session = await Session.findById(session_id)
    if (!session) {
      return reply.status(404).send({
        message: 'Session not found',
      })
    }

    // Check if the user owns the session
    if (session.owner.toString() !== currentUserId.toString()) {
      return reply.status(403).send({
        message: 'User not authorized to update this session',
      })
    }

    // Forward the request to compute API
    const edenComputeRequest = {
      endpoint: `${server.config.EDEN_COMPUTE_API_URL}/sessions/status`,
      data: { session_id, status },
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

    return reply.status(200).send(response)
  } catch (error) {
    server.log.error({ err: error }, 'Error updating session status:')

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message =
        error.response?.data?.message || 'Failed to update session status'

      return reply.status(status).send({
        message,
      })
    }

    return reply.status(500).send({
      message: 'Internal server error',
    })
  }
}

/**
 * Add a message to a session passively (without triggering agent responses)
 * This is used for realtime voice conversations where messages are recorded
 * but should not trigger the async prompt flow
 */
export const addPassiveMessage = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Body: {
      session_id: string
      user_id: string
      role: 'user' | 'assistant'
      content: string
    }
  }>,
  reply: FastifyReply,
) => {
  const { session_id, user_id, role, content } = request.body

  // Validation
  if (!session_id) {
    return reply.status(400).send({
      message: 'session_id is required',
    })
  }

  if (!user_id) {
    return reply.status(400).send({
      message: 'user_id is required',
    })
  }

  if (!role || !['user', 'assistant'].includes(role)) {
    return reply.status(400).send({
      message: 'role must be either "user" or "assistant"',
    })
  }

  if (!content || typeof content !== 'string') {
    return reply.status(400).send({
      message: 'content is required and must be a string',
    })
  }

  try {
    // Verify session exists
    const session = await Session.findById(session_id)
    if (!session) {
      return reply.status(404).send({
        message: 'Session not found',
      })
    }

    // Verify user exists
    const user = await User.findById(user_id)
    if (!user) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    const userIdStr = user_id.toString()
    const isSessionOwner = session.owner.toString() === userIdStr
    const isSessionUser = isUserInList(session.users, userIdStr)
    const sessionPermission = await SessionPermission.findOne({
      session: session_id,
      user: user_id,
    })

    if (
      !isSessionOwner &&
      !isSessionUser &&
      !canInteractWithPermission(sessionPermission)
    ) {
      return reply.status(403).send({
        message: 'User not authorized to post to this session',
      })
    }

    // For assistant role, we need to find the agent
    let senderId: ObjectId
    if (role === 'assistant') {
      // Get the first agent in the session as the sender
      // (or you could pass agent_id in the request body if needed)
      if (!session.agents || session.agents.length === 0) {
        return reply.status(400).send({
          message: 'Session has no agents for assistant message',
        })
      }
      const firstAgent = session.agents[0]
      // Handle both ObjectId and populated AgentDocument
      senderId =
        firstAgent instanceof ObjectId
          ? firstAgent
          : new ObjectId((firstAgent as any)._id || firstAgent)
    } else {
      senderId = new ObjectId(user_id)
    }

    // Create and save the message directly to MongoDB
    const message = new Message({
      session: [new ObjectId(session_id)],
      sender: senderId,
      eden_user_id: new ObjectId(user_id),
      role: role,
      content: content,
    })

    await message.save()

    // Add message to session's messages array
    session.messages.push(message._id as any)
    await session.save()

    return reply.status(200).send({
      success: true,
      message_id: message._id.toString(),
    })
  } catch (error) {
    server.log.error({ err: error }, 'Error adding passive message:')

    return reply.status(500).send({
      message: 'Internal server error',
    })
  }
}

/**
 * Add or update a tool call on the most recent assistant message in a session.
 * This is used for realtime voice conversations where tools are called by the agent.
 *
 * Flow:
 * 1. When tool starts: Call with status='pending', returns tool_call_id and message_id
 * 2. When tool completes: Call with tool_call_id, status='completed', and result
 * 3. When tool fails: Call with tool_call_id, status='failed', and error
 */
export const addToolCallToMessage = async (
  server: FastifyInstance,
  request: FastifyRequest<{
    Body: {
      session_id: string
      user_id: string
      tool_call_id?: string // If provided, update existing; if not, create new
      tool_name: string
      args?: Record<string, unknown>
      status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
      result?: unknown
      error?: string
      task_id?: string
    }
  }>,
  reply: FastifyReply,
) => {
  const {
    session_id,
    user_id,
    tool_call_id,
    tool_name,
    args,
    status = 'pending',
    result,
    error,
    task_id,
  } = request.body

  // Validation
  if (!session_id) {
    return reply.status(400).send({ message: 'session_id is required' })
  }

  if (!user_id) {
    return reply.status(400).send({ message: 'user_id is required' })
  }

  if (!tool_name) {
    return reply.status(400).send({ message: 'tool_name is required' })
  }

  try {
    // Verify session exists
    const session = await Session.findById(session_id)
    if (!session) {
      return reply.status(404).send({ message: 'Session not found' })
    }

    // Verify user exists
    const user = await User.findById(user_id)
    if (!user) {
      return reply.status(404).send({ message: 'User not found' })
    }

    // Check user permission
    const userIdStr = user_id.toString()
    const isSessionOwner = session.owner.toString() === userIdStr
    const isSessionUser = isUserInList(session.users, userIdStr)
    const sessionPermission = await SessionPermission.findOne({
      session: session_id,
      user: user_id,
    })

    if (
      !isSessionOwner &&
      !isSessionUser &&
      !canInteractWithPermission(sessionPermission)
    ) {
      return reply.status(403).send({
        message: 'User not authorized to modify this session',
      })
    }

    // If tool_call_id provided, update existing tool call
    if (tool_call_id) {
      // Find message with this tool call
      const message = await Message.findOne({
        session: new ObjectId(session_id),
        'tool_calls.id': tool_call_id,
      })

      if (!message) {
        return reply.status(404).send({
          message: `Tool call ${tool_call_id} not found in session`,
        })
      }

      // Update the specific tool call
      const toolCallIndex = message.tool_calls?.findIndex(
        tc => tc.id === tool_call_id,
      )
      if (toolCallIndex === undefined || toolCallIndex < 0) {
        return reply.status(404).send({
          message: `Tool call ${tool_call_id} not found in message`,
        })
      }

      // Update the tool call fields
      const updateFields: Record<string, unknown> = {}
      if (status) {
        updateFields[`tool_calls.${toolCallIndex}.status`] = status
      }
      if (result !== undefined) {
        updateFields[`tool_calls.${toolCallIndex}.result`] = result
      }
      if (error !== undefined) {
        updateFields[`tool_calls.${toolCallIndex}.error`] = error
      }
      if (task_id) {
        updateFields[`tool_calls.${toolCallIndex}.task`] = task_id
      }

      await Message.updateOne({ _id: message._id }, { $set: updateFields })

      return reply.status(200).send({
        success: true,
        tool_call_id,
        message_id: message._id.toString(),
      })
    }

    // No tool_call_id - create new tool call on most recent assistant message
    // Find the most recent assistant message for this session
    let message = await Message.findOne({
      session: new ObjectId(session_id),
      role: 'assistant',
    }).sort({ createdAt: -1 })

    // If no assistant message exists, create one
    if (!message) {
      // Get the first agent in the session as sender
      if (!session.agents || session.agents.length === 0) {
        return reply.status(400).send({
          message: 'Session has no agents for assistant message',
        })
      }
      const firstAgent = session.agents[0]
      const senderId =
        firstAgent instanceof ObjectId
          ? firstAgent
          : new ObjectId((firstAgent as any)._id || firstAgent)

      message = new Message({
        session: [new ObjectId(session_id)],
        sender: senderId,
        eden_user_id: new ObjectId(user_id),
        role: 'assistant',
        content: '',
        tool_calls: [],
      })
      await message.save()

      // Add message to session's messages array
      session.messages.push(message._id as any)
      await session.save()
    }

    // Generate a unique tool call ID
    const newToolCallId = `toolcall_${crypto
      .randomUUID()
      .replace(/-/g, '')
      .slice(0, 24)}`

    // Create the tool call object
    const toolCall = {
      id: newToolCallId,
      name: tool_name,
      tool: tool_name,
      args: args || {},
      status: status,
      result: result,
      error: error,
      task: task_id,
    }

    // Add tool call to message
    await Message.updateOne(
      { _id: message._id },
      { $push: { tool_calls: toolCall } },
    )

    return reply.status(200).send({
      success: true,
      tool_call_id: newToolCallId,
      message_id: message._id.toString(),
    })
  } catch (err) {
    server.log.error({ err }, 'Error adding tool call to message:')
    return reply.status(500).send({ message: 'Internal server error' })
  }
}
