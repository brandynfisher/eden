import { Agent } from '../../models/Agent'
import { Notification } from '../../models/Notification'
import {
  SessionPermission,
  SessionPermissionLevel,
} from '../../models/SessionPermission'
import { User } from '../../models/User'
import { Message } from '../../models/v2/Message'
import { SessionShare } from '../../models/v2/SessionShareV2'
import { Session } from '../../models/v2/SessionV2'
import { QueryOptions } from '../../repositories/RestfulRepository'
import SessionRepository from '../../repositories/SessionRepository'
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
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

// Helper function to create eden messages for agent operations
const createEdenMessage = async (
  sessionId: ObjectId,
  messageType: 'agent_add' | 'agent_remove',
  agents: any[],
) => {
  const edenMessage = new Message({
    session: sessionId,
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
    type: sessionType,
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
      !['chat', 'passive', 'automatic'].includes(sessionType)
    ) {
      return reply.status(400).send({
        message: 'type must be "chat", "passive", or "automatic"',
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
        settingsObj.delay_interval > 3600)
    ) {
      return reply.status(400).send({
        message: 'delay_interval must be a number between 0 and 3600',
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
      sessionData.type = sessionType
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
      type?: 'chat' | 'passive' | 'automatic'
      settings?: {
        conductor_prompt?: string
        delay_interval: number
        mention_force_reply: boolean
      }
      extras?: {
        exclude_memory?: boolean
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
    type: sessionType,
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
      sessionData.type = sessionType
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
    const isAllowedUser = session.users?.some(
      (user: any) => user.toString() === currentUserIdStr,
    )
    const hasPermission = await SessionPermission.exists({
      session: session._id,
      user: userId,
    })

    if (!isOwner && !isAllowedUser && !hasPermission) {
      return reply.status(403).send({
        message: 'You do not have access to this session',
      })
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

      return reply.status(200).send({
        session_id: modalResponse.data.session_id,
        message_id,
      })
    }
  } catch (e) {
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
      select: '_id title name createdAt updatedAt trigger agents users pinned',
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
      ],
    }

    const sessionsRepository = new SessionRepository(Session)
    const sessionQuery: any = {
      $or: [{ owner: userId }, { users: userId }],
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

    return reply.status(200).send(paginatedResponse)
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
  }>,
  reply: FastifyReply,
) => {
  const { userId, featureFlags } = request.user || {}

  const { session_id } = request.params
  const limit = 25 // Fixed limit for initial session load

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

    // If not authenticated, only allow access to public sessions
    if (!userId) {
      if (!isPublicSession) {
        return reply.status(401).send({
          message: 'Authentication required to access this session',
        })
      }
      // Continue to fetch and return session for public access
    } else {
      // Check if user has access to the session (owner, in users list, has permission, is eden admin, or session is public)
      const getSessionUserIdStr = userId.toString()
      const isSessionOwner =
        session.owner._id.toString() === getSessionUserIdStr
      const isSessionUser = session.users?.some(
        (user: any) => user.toString() === getSessionUserIdStr,
      )
      const hasPermission = await SessionPermission.exists({
        session: session._id,
        user: userId,
      })
      const isEdenTeamMember = featureFlags?.includes(FeatureFlag.EdenAdmin)

      if (
        !isSessionOwner &&
        !isSessionUser &&
        !hasPermission &&
        !isEdenTeamMember &&
        !isPublicSession
      ) {
        return reply.status(403).send({
          message:
            'You do not have access to this session. If you believe this is an error, ask the session owner to create a share link.',
        })
      }
    }

    // Fetch latest messages (no pagination on initial session fetch)
    // Fetch limit+1 to check if there are more
    const fetchLimit = limit + 1
    const messages = await Message.find({ session: session._id })
      .populate({
        path: 'sender',
        select: '_id username userImage',
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(fetchLimit)
      .select(
        '_id content sender role eden_message_data tool_calls thought attachments createdAt reactions',
      )

    // Check if there are more messages by seeing if we got more than limit
    const hasMore = messages.length > limit
    const paginatedMessages = hasMore
      ? messages.slice(0, limit).reverse()
      : messages.reverse()

    // Generate cursor for fetching older messages if there are more
    let nextCursor: string | undefined
    if (hasMore && paginatedMessages.length > 0) {
      const oldestMessage = paginatedMessages[0]
      const createdAt = oldestMessage.createdAt || new Date()
      const cursorString = `${createdAt.toISOString()}_${oldestMessage._id}`
      nextCursor = Buffer.from(cursorString).toString('base64')
    }

    // Fetch permissions for the session
    const permissions = await SessionPermission.find({
      session: session._id,
    }).populate({
      path: 'user',
      select: '_id username userImage',
    })

    // Add messages and permissions to the session object
    const sessionWithPermissions = {
      ...session.toObject(),
      messages: paginatedMessages,
      permissions,
    }

    return reply.status(200).send({
      session: sessionWithPermissions,
      nextCursor,
      hasMore,
    })
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Unknown Error'

    server.log.error({
      message: 'Failed to get session',
      error: errorMessage,
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
      const isUser = session.users?.some(
        (user: any) => user.toString() === userIdStr,
      )
      const hasPermission = await SessionPermission.exists({
        session: session._id,
        user: userId,
      })
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
    const messageQuery: any = {
      session: session._id,
    }

    if (cursor) {
      try {
        const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8')
        const [cursorCreatedAt, cursorId] = decodedCursor.split('_')

        // Find messages older than the cursor
        messageQuery.$or = [
          { createdAt: { $lt: new Date(cursorCreatedAt) } },
          {
            createdAt: new Date(cursorCreatedAt),
            _id: { $lt: new ObjectId(cursorId) },
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
        select: '_id username userImage',
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(fetchLimit)
      .select(
        '_id content sender role eden_message_data tool_calls thought attachments createdAt reactions',
      )

    // Check if there are more messages
    const hasMore = messages.length > limit
    const paginatedMessages = hasMore
      ? messages.slice(0, limit).reverse()
      : messages.reverse()

    // Generate next cursor if there are more
    let nextCursor: string | undefined
    if (hasMore && paginatedMessages.length > 0) {
      const oldestMessage = paginatedMessages[0]
      const createdAt = oldestMessage.createdAt || new Date()
      const cursorString = `${createdAt.toISOString()}_${oldestMessage._id}`
      nextCursor = Buffer.from(cursorString).toString('base64')
    }

    return reply.status(200).send({
      messages: paginatedMessages,
      hasMore,
      nextCursor,
    })
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Unknown Error'

    server.log.error({
      message: 'Failed to get session messages',
      error: errorMessage,
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

  // Find the session to check access
  const session = await Session.findOne({
    _id: message.session,
  })

  if (!session) {
    return reply.status(404).send({
      message: 'Session not found',
    })
  }

  // Check if user has access to the session (owner, in users list, or has permission)
  const reactionUserIdStr = userId.toString()
  const isSessionOwner = session.owner.toString() === reactionUserIdStr
  const isSessionUser = session.users?.some(
    (user: any) => user.toString() === reactionUserIdStr,
  )
  const hasPermission = await SessionPermission.exists({
    session: session._id,
    user: userId,
  })

  if (!isSessionOwner && !isSessionUser && !hasPermission) {
    return reply.status(403).send({
      message: 'You do not have access to this session',
    })
  }

  // Initialize reactions if it doesn't exist
  if (!message.reactions) {
    message.reactions = {}
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

  if (session.owner.toString() !== userId.toString()) {
    return reply.status(401).send({
      error: 'You are not allowed to delete this session',
    })
  }

  await session.delete()

  return reply.status(200).send({ success: true })
}

export const renameSession = async (
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
    type: sessionType,
    settings,
    context,
    budget,
  } = request.body

  if (
    title === undefined &&
    pinned === undefined &&
    extras === undefined &&
    agent_ids === undefined &&
    sessionType === undefined &&
    settings === undefined &&
    context === undefined &&
    budget === undefined
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

  if (session.owner.toString() !== userId.toString()) {
    return reply.status(401).send({
      error: 'You are not allowed to modify this session',
    })
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
    updateData.type = sessionType
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

  await session.updateOne({
    $set: updateData,
  })

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

  if (session.owner.toString() !== userId.toString()) {
    return reply.status(401).send({
      error: 'You are not allowed to cancel this session',
    })
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

    if (session.owner.toString() !== userId.toString()) {
      return reply.status(403).send({
        error: 'Only session owner can create shares',
      })
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
        select: '_id title context agents createdAt',
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
        '_id content sender role eden_message_data tool_calls thought attachments createdAt',
      )

    return reply.status(200).send({
      share: {
        share_id: sessionShare._id.toString(),
        title: sessionShare.title,
        session: sessionShare.session,
        messages,
        owner: sessionShare.owner,
        createdAt: sessionShare.createdAt,
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
    const isAllowedUser = session.users?.some(
      (user: any) => user.toString() === currentUserIdStr,
    )
    const hasPermission = await SessionPermission.exists({
      session: session._id,
      user: userId,
    })

    if (!isOwner && !isAllowedUser && !hasPermission) {
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

  const permission = await SessionPermission.findOne({
    session: sessionId,
    user: userId,
    level: SessionPermissionLevel.Owner,
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
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { session_id } = request.params as { session_id: string }
  const { permissions } = request.body as {
    permissions: Array<{ username: string; level: 'editor' | 'owner' }>
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
      existingPermissions.map(p => [(p.user as any).username, p.level]),
    )

    await SessionPermission.deleteMany({ session: session_id })

    const newPermissions = []

    for (const perm of permissions) {
      const query = createMultiFieldQuery(perm.username, ['userId', 'username'])
      const user = await User.findOne(query)

      if (!user) {
        return reply.status(404).send({
          error: `User not found: ${perm.username}`,
        })
      }

      const newPermission = await SessionPermission.create({
        session: session_id,
        user: user._id,
        level:
          perm.level === 'owner'
            ? SessionPermissionLevel.Owner
            : SessionPermissionLevel.Editor,
        grantedBy: currentUserId,
        grantedAt: new Date(),
      })

      newPermissions.push({
        permission: newPermission,
        user,
        username: perm.username,
        level: perm.level,
      })

      const existingLevel = existingUserMap.get(perm.username)
      if (!existingLevel) {
        await Notification.create({
          user: user._id,
          type: 'session_permission_added',
          title: 'Session Permission Added',
          message: `You've been granted ${perm.level} access to the session "${
            session.title || 'Untitled Session'
          }".`,
          priority: 'normal',
          action_url: `/sessions/${session_id}`,
          channels: ['in_app'],
        })
      } else if (
        existingLevel !==
        (perm.level === 'owner'
          ? SessionPermissionLevel.Owner
          : SessionPermissionLevel.Editor)
      ) {
        await Notification.create({
          user: user._id,
          type: 'session_permission_added',
          title: 'Session Permission Updated',
          message: `Your access to the session "${
            session.title || 'Untitled Session'
          }" has been changed to ${perm.level}.`,
          priority: 'normal',
          action_url: `/sessions/${session_id}`,
          channels: ['in_app'],
        })
      }
    }

    const newUserMap = new Map(newPermissions.map(p => [p.username, p.level]))

    for (const [username, _] of existingUserMap) {
      if (!newUserMap.has(username)) {
        const removedUser = await User.findOne(
          createMultiFieldQuery(username, ['userId', 'username']),
        )
        if (removedUser) {
          await Notification.create({
            user: removedUser._id,
            type: 'session_permission_removed',
            title: 'Session Permission Removed',
            message: `Your access to the session "${
              session.title || 'Untitled Session'
            }" has been removed.`,
            priority: 'normal',
            action_url: `/sessions`,
            channels: ['in_app'],
          })
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
