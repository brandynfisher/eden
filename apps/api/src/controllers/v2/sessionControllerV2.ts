import { Agent } from '../../models/Agent'
import { User } from '../../models/User'
import { Message } from '../../models/v2/Message'
import { Session } from '../../models/v2/SessionV2'
import { QueryOptions } from '../../repositories/RestfulRepository'
import SessionRepository from '../../repositories/SessionRepository'
import { createIdOrSlugQuery } from '../../utils/mongoUtils'
import {
  SessionsV2CreateArguments,
  SessionsV2DeleteArguments,
  SessionsV2GetArguments,
  SessionsV2ListArguments,
  SessionsV2MessageArguments,
  SessionsV2MessageReactArguments,
  SessionsV2RenameArguments,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

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

  const { agent_ids, scenario, budget, title } = request.body

  // Validation
  if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
    return reply.status(400).send({
      message: 'agent_ids must be a non-empty array',
    })
  }

  if (
    !scenario ||
    typeof scenario !== 'string' ||
    scenario.length < 10 ||
    scenario.length > 1000
  ) {
    return reply.status(400).send({
      message: 'scenario must be a string between 10 and 1000 characters',
    })
  }

  if (!budget || typeof budget !== 'number' || budget < 100 || budget > 5000) {
    return reply.status(400).send({
      message: 'budget must be a number between 100 and 5000',
    })
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
    const session = new Session({
      owner: userId,
      agents: validAgentIds,
      scenario,
      budget,
      spent: 0,
      messages: [],
      title:
        title ||
        `Session with ${agent_ids.length} agent${
          agent_ids.length > 1 ? 's' : ''
        }`,
    })

    await session.save()

    // Populate the session with agent and owner data
    const populatedSession = await Session.findById(session._id)
      .populate({
        path: 'owner',
        select: '_id username userId userImage',
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
  request: FastifyRequest<{ Body: SessionsV2MessageArguments }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { session_id, content, attachments } = request.body

  console.log({
    content,
    attachments,
    sender: userId,
    session: session_id,
  })

  if (!session_id) {
    return reply.status(400).send({
      message: 'session_id not provided',
    })
  }

  const query = createIdOrSlugQuery(session_id)
  const session = await Session.findOne(query)

  if (!session) {
    return reply.status(404).send({
      message: 'session not found',
    })
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
      session_id,
      message: {
        content,
        attachments,
      },
      user_id: userId,
    },
    headers: {
      'X-Client-Platform': 'web',
      'X-Client-Deployment-Id': session.id,
    },
  }

  try {
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
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Unknown Error'
    console.log(e)
    return reply.status(500).send({ error: errorMessage })
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

  const { limit = 25, page, sort } = request.query

  try {
    const queryOptions: QueryOptions = {
      select: '_id title name createdAt updatedAt',
      limit,
      page,
      sort: {
        ...sort,
        updatedAt: -1,
        createdAt: -1,
      },
    }

    const sessionsRepository = new SessionRepository(Session)
    const sessionQuery = {
      owner: userId,
    }

    const paginatedResponse = await sessionsRepository.query(
      sessionQuery,
      queryOptions,
    )

    return reply.status(200).send(paginatedResponse)
  } catch (e) {
    console.log(e)

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
  request: FastifyRequest<{ Params: SessionsV2GetArguments }>,
  reply: FastifyReply,
) => {
  const { session_id } = request.params

  try {
    const session = await Session.findOne({
      _id: new ObjectId(session_id as string),
    })
      .populate({
        path: 'owner',
        select: '_id username userId userImage',
      })
      .populate({
        path: 'agents',
        select: '_id username userImage',
      })
      .populate({
        path: 'messages',
        select: '_id content sender tool_calls createdAt reactions',
        populate: {
          path: 'sender',
          select: '_id username userImage',
        },
      })

    if (!session) {
      return reply.status(404).send({
        message: 'Session not found',
      })
    }

    // const extendedMessages = session.messages.map(msg => {
    //   if (msg.role !== 'assistant') {
    //     return msg
    //   }

    //   const hasPendingToolCalls =
    //     msg.tool_calls?.length &&
    //     msg.tool_calls?.some(
    //       call =>
    //         !call.status ||
    //         call.status === TaskV2Status.Running ||
    //         call.status === TaskV2Status.Pending,
    //     )
    //   return {
    //     ...msg,
    //     status: hasPendingToolCalls
    //       ? { type: 'running' }
    //       : { type: 'complete', reason: 'stop' },
    //   }
    // })

    // session.messages = extendedMessages

    return reply.status(200).send({ session })
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
    Body: Pick<SessionsV2RenameArguments, 'title'>
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
  const { title } = request.body

  if (!title) {
    return reply.status(400).send({
      error: 'Title not provided',
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
      error: 'You are not allowed to rename this session',
    })
  }

  await session.updateOne({
    $set: {
      title: title,
    },
  })

  return reply.status(200).send({ success: true })
}
