import {
  InteractionEvent,
  ScenarioType,
  SessionEventsListArguments,
  SessionsCreateArguments,
  SessionsDeleteArguments,
  SessionsGetArguments,
  SessionsListArguments,
  SessionsUpdateArguments,
} from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { User } from '../models/Creator'
import { Session } from '../models/Session'
import { SessionEvent } from '../models/SessionEvent'
import CreatorRepository from '../repositories/CreatorRepository'
import SessionEventRepository from '../repositories/SessionEventRepository'
import SessionRepository from '../repositories/SessionRepository'

export const createSession = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { type } = request.body as SessionsCreateArguments

  if (!Object.values(ScenarioType).includes(type)) {
    return reply.status(400).send({
      message: 'Session type not found',
    })
  }

  const input = {
    user: userId,
    type,
  }

  const sessionRepository = new SessionRepository(Session)
  const session = await sessionRepository.create(input)

  return reply.status(200).send({
    sessionId: session._id,
  })
}

export const updateSession = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { sessionId, type, data } = request.body as SessionsUpdateArguments

  if (!sessionId) {
    return reply.status(400).send({
      message: 'You must provide an sessionId',
    })
  }

  const session = await Session.findOne({
    _id: sessionId,
  })

  if (!session) {
    return reply.status(401).send({
      message: 'Session not found',
    })
  }

  const input = {
    session,
    type,
    data,
  }

  const sessionEventRepository = new SessionEventRepository(SessionEvent)
  const sessionEvent = await sessionEventRepository.create(input)

  return reply.status(200).send({ eventId: sessionEvent._id })
}

export const deleteSession = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId } = request.user
  const { sessionId } = request.body as SessionsDeleteArguments

  if (!sessionId) {
    return reply.status(400).send({
      message: 'You must provide an sessionId',
    })
  }

  const dbSession = await Session.findOne({
    sessionId,
    user: userId,
  })

  if (!dbSession) {
    return reply.status(401).send({
      message: 'Session not found',
    })
  }

  await dbSession.delete()

  return reply.status(200).send({})
}

export const listSessions = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, limit, page, sort } = request.query as SessionsListArguments

  const creatorsRepository = new CreatorRepository(User)
  const creators = await creatorsRepository.query({
    userId,
  })

  const sessionRepository = new SessionRepository(Session)
  const sessionPaginatedResponse = await sessionRepository.query(
    {
      user:
        creators.docs.length > 0
          ? creators.docs.map(creator => creator._id)
          : undefined,
    },
    {
      limit,
      page,
      sort,
    },
  )
  const response = {
    ...sessionPaginatedResponse,
    docs: sessionPaginatedResponse.docs.map(session => ({
      id: session._id,
      type: session.type,
    })),
  }

  return reply.status(200).send(response)
}

export const getSession = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { sessionId } = request.params as SessionsGetArguments
  const session = await Session.findById(sessionId)
  if (!session) {
    return reply.status(404).send({
      message: 'Session not found',
    })
  }

  const response = {
    id: session._id,
    type: session.type,
  }

  return reply.status(200).send({ session: response })
}

export const getSessionEvents = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { sessionId, limit, page, sort } =
    request.params as SessionEventsListArguments
  const session = await Session.findOne({ sessionId })
  if (!session) {
    return reply.status(404).send({
      message: 'Session not found',
    })
  }

  const sessionEventsRepository = new SessionEventRepository(SessionEvent)
  const sessionEventsPaginatedResponse = await sessionEventsRepository.query(
    {
      session: session._id,
    },
    {
      limit,
      page,
      sort,
    },
  )

  const response = {
    ...sessionEventsPaginatedResponse,
    docs: sessionEventsPaginatedResponse.docs.map(sessionEvent => ({
      id: sessionEvent._id,
      type: sessionEvent.type,
      data: sessionEvent.data,
    })),
  }

  return reply.status(200).send(response)
}

export interface SessionInteractArguments {
  userId: string
  sessionId: string
  interaction: InteractionEvent
}

export const interactSession = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { userId, sessionId, interaction } =
    request.body as SessionInteractArguments

  const session = await Session.findById(sessionId)
  if (!session) {
    return reply.status(404).send({
      message: 'Session not found',
    })
  }

  // TODO: Check if user is allowed to interact with session

  const { type, data } = await server.handleInteraction(server, interaction)

  reply.status(200).send({
    type,
    data,
  })
}
