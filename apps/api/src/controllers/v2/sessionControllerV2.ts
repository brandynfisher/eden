import { Agent } from '../../models/Agent'
import { User } from '../../models/User'
import { Session } from '../../models/v2/SessionV2'
import { QueryOptions } from '../../repositories/RestfulRepository'
import SessionRepository from '../../repositories/SessionRepository'
import { createIdOrSlugQuery } from '../../utils/mongoUtils'
import {
  SessionsV2CreateArguments,
  SessionsV2DeleteArguments,
  SessionsV2GetArguments,
  SessionsV2ListArguments,
  SessionsV2MessageReactArguments,
  SessionsV2PinMessageArguments,
  SessionsV2RenameArguments,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

export const createSessionMessage = async (
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

  const { session_id, agent_id, content, attachments } = request.body

  if (!agent_id) {
    return reply.status(400).send({
      message: 'agent_id not provided',
    })
  }

  const query = createIdOrSlugQuery(agent_id)
  const agent = await Agent.findOne(query)

  if (!agent) {
    return reply.status(404).send({
      message: 'agent not found',
    })
  }

  const userDocument = await User.findById(userId)
  if (!userDocument) {
    return reply.status(404).send({
      message: `User not found`,
    })
  }

  const modalRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/session`,
    data: {
      agent_id: agent._id,
      session_id,
      user_message: {
        content,
        attachments,
      },
      user_id: userId,
      force_reply: true,
    },
    headers: {
      'X-Client-Platform': 'web',
      'X-Client-Agent': agent.username,
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
      // owner: userId,
    }

    const paginatedResponse = await sessionsRepository.query(
      sessionQuery,
      queryOptions,
    )

    // await sessionsRepository.model.populate(paginatedResponse.docs, {
    //   path: 'agents',
    //   select: '_id name username userImage',
    // })

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
        select: '_id content sender tool_calls',
        populate: {
          path: 'sender',
          select: '_id username userImage',
        },
      })

    console.log({
      session,
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
  server: FastifyInstance,
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

  try {
    const query = {
      owner: userId,
      'messages.id': new ObjectId(message_id),
    }

    const session = await Session.findOne(query)

    if (reaction === 'thumbs_up') {
      const existingReactions =
        session?.messages.find(m => m.id?.toString() === message_id)?.reactions
          ?.thumbs_up || []

      if (
        existingReactions.map(id => id?.toString()).includes(userId.toString())
      ) {
        await Session.updateOne(
          query,
          {
            $pull: { 'messages.$[msg].reactions.thumbs_up': userId },
          },
          {
            arrayFilters: [{ 'msg.id': new ObjectId(message_id) }],
          },
        )
      } else {
        await Session.updateOne(
          query,
          {
            $push: { 'messages.$[msg].reactions.thumbs_up': userId },
          },
          {
            arrayFilters: [{ 'msg.id': new ObjectId(message_id) }],
          },
        )
      }
    } else if (reaction === 'thumbs_down') {
      const existingReactions =
        session?.messages.find(m => m.id?.toString() === message_id)?.reactions
          ?.thumbs_down || []

      if (
        existingReactions.map(id => id?.toString()).includes(userId.toString())
      ) {
        await Session.updateOne(
          query,
          {
            $pull: { 'messages.$[msg].reactions.thumbs_down': userId },
          },
          {
            arrayFilters: [{ 'msg.id': new ObjectId(message_id) }],
          },
        )
      } else {
        await Session.updateOne(
          query,
          {
            $push: { 'messages.$[msg].reactions.thumbs_down': userId },
          },
          {
            arrayFilters: [{ 'msg.id': new ObjectId(message_id) }],
          },
        )
      }
    }

    return reply.status(200).send({ success: true })
  } catch (e) {
    console.log(e)
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Unknown Error'

    server.log.error({
      message: 'Failed to add session message reaction',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
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

export const pinSessionMessage = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Body: SessionsV2PinMessageArguments }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      error: 'User missing from request',
    })
  }

  const { message_id } = request.body

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

  try {
    const query = {
      owner: userId,
      'messages.id': new ObjectId(message_id),
    }

    await Session.updateOne(
      query,
      {
        $set: { 'messages.$[msg].pinned': true },
      },
      {
        arrayFilters: [{ 'msg.id': new ObjectId(message_id) }],
      },
    )

    return reply.status(200).send({ success: true })
  } catch (e) {
    console.log(e)
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Unknown Error'

    server.log.error({
      message: 'Failed to pin session message',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}

export const unpinSessionMessage = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Body: SessionsV2PinMessageArguments }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      error: 'User missing from request',
    })
  }

  const { message_id } = request.body

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

  try {
    const query = {
      owner: userId,
      'messages.id': new ObjectId(message_id),
    }

    await Session.updateOne(
      query,
      {
        $set: { 'messages.$[msg].pinned': false },
      },
      {
        arrayFilters: [{ 'msg.id': new ObjectId(message_id) }],
      },
    )

    return reply.status(200).send({ success: true })
  } catch (e) {
    console.log(e)
    const error = e as { response?: { data?: string } }
    const errorMessage = error?.response?.data || 'Unknown Error'

    server.log.error({
      message: 'Failed to unpin session message',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}
