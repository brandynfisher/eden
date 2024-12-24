import { User } from '../../models/User'
import { Thread as ThreadModel } from '../../models/v2/Thread'
import { QueryOptions } from '../../repositories/RestfulRepository'
import ThreadRepository from '../../repositories/ThreadRepository'
import {
  ThreadsCreateArguments,
  ThreadsGetArguments,
  ThreadsListArguments,
  ThreadsMessageReactArguments,
} from '@edenlabs/eden-sdk'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ObjectId } from 'mongodb'

export const createThreadMessage = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { thread_id, agent_id, content, attachments } =
    request.body as ThreadsCreateArguments

  const userDocument = await User.findById(userId)
  if (!userDocument) {
    return reply.status(404).send({
      message: `User not found`,
    })
  }

  const modalRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/chat`,
    data: {
      agent_id,
      thread_id,
      user_message: {
        content,
        attachments,
      },
      user_id: userId,
      force_reply: true
    },
  }

  server.log.info('> modal::request::chat')
  server.log.info(modalRequest)

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

    server.log.info('< modal::response::chat')
    server.log.info(modalResponse.data)

    if (!modalResponse || !modalResponse.data) {
      console.log('malformed response', modalResponse)
      return reply.status(500).send({
        message: `Empty / Unexpected response from compute api`,
      })
    }

    return reply.status(200).send({ thread_id: modalResponse.data.thread_id })
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage =
      error && error.response && error.response.data
        ? error.response.data
        : 'Unknown Error'
    console.log(e)
    server.log.error({
      message: 'Failed to create thread/message',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}

export const listThreads = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(404).send({
      message: `User not found`,
    })
  }

  const { limit = 25, page, sort } = request.query as ThreadsListArguments

  try {
    const query = {
      user: user._id,
    }

    const queryOptions: QueryOptions = {
      select: '_id title name createdAt updatedAt user agent',
      limit,
      page,
      sort: {
        ...sort,
        updatedAt: -1,
        createdAt: -1,
      },
    }

    const threadsRepository = new ThreadRepository(ThreadModel)
    const paginatedResponse = await threadsRepository.query(query, queryOptions)

    await threadsRepository.model.populate(paginatedResponse.docs, {
      path: 'agent',
      select: '_id username userImage',
    })

    return reply.status(200).send(paginatedResponse)
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage =
      error && error.response && error.response.data
        ? error.response.data
        : 'Unknown Error'

    server.log.error({
      message: 'Failed to list threads',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}

export const getThread = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { thread_id } = request.params as ThreadsGetArguments

  const user = await User.findById(userId)
  if (!user) {
    return reply.status(400).send({
      message: 'User not found',
    })
  }

  try {
    const thread = await ThreadModel.findOne({
      _id: new ObjectId(thread_id),
      user: userId,
    })
      .populate({
        path: 'user',
        select: '_id username userId userImage',
      })
      .populate({
        path: 'agent',
        select: '_id username userImage',
      })

    // console.log(thread)

    if (!thread) {
      return reply.status(404).send({
        message: 'Thread not found',
      })
    }

    return reply.status(200).send({ thread })
  } catch (e) {
    const error = e as { response?: { data?: string } }
    const errorMessage =
      error && error.response && error.response.data
        ? error.response.data
        : 'Unknown Error'

    server.log.error({
      message: 'Failed to get thread',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}

export const addThreadMessageReaction = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { message_id, reaction } = request.body as ThreadsMessageReactArguments

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
      user: userId,
      'messages.id': new ObjectId(message_id),
    }

    const thread = await ThreadModel.findOne(query)

    if (reaction === 'thumbs_up') {
      const existingReactions =
        thread?.messages.find(m => {
          return m.id.toString() === message_id
        })?.reactions?.thumbs_up || []

      console.log({ existingReactions })

      if (
        existingReactions
          .map(reactingUserId => reactingUserId?.toString())
          .includes(userId.toString())
      ) {
        console.log('already reacted', 'remove', userId.toString())
        // User already reacted, remove the reaction
        await ThreadModel.updateOne(
          query,
          {
            $pull: { 'messages.$[msg].reactions.thumbs_up': userId },
          },
          {
            arrayFilters: [{ 'msg.id': new ObjectId(message_id) }],
          },
        )
      } else {
        console.log('not reacted', 'add', userId.toString())
        // User has not reacted, add the reaction
        await ThreadModel.updateOne(
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
        thread?.messages.find(m => m.id.toString() === message_id)?.reactions
          ?.thumbs_down || []

      if (
        existingReactions
          .map(reactingUserId => reactingUserId?.toString())
          .includes(userId.toString())
      ) {
        // User already reacted, remove the reaction
        await ThreadModel.updateOne(
          query,
          {
            $pull: { 'messages.$[msg].reactions.thumbs_down': userId },
          },
          {
            arrayFilters: [{ 'msg.id': new ObjectId(message_id) }],
          },
        )
      } else {
        // User has not reacted, add the reaction
        await ThreadModel.updateOne(
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
    const errorMessage =
      error && error.response && error.response.data
        ? error.response.data
        : 'Unknown Error'

    server.log.error({
      message: 'Failed to add thread message reaction',
      error: errorMessage,
    })
    return reply.status(500).send({ error: errorMessage })
  }
}
