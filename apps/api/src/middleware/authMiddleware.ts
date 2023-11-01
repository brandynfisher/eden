import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

import { ApiKey } from '../models/ApiKey'
import { User } from '../models/Creator'

const apiKeyVerify = async (request: FastifyRequest) => {
  if (!request.headers['x-api-secret']) {
    throw new Error('Missing API secret')
  }

  const apiKey = await ApiKey.findOne({
    apiKey: request.headers['x-api-key'],
    apiSecret: request.headers['x-api-secret'],
  })

  if (!apiKey) {
    throw new Error('Invalid API key or secret')
  }

  const user = await User.findById(apiKey.user)

  if (!user) {
    throw new Error('User not found')
  }

  request.user = {
    userId: user._id,
    isAdmin: user.isAdmin || false,
  }
}

const getCredential = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (request.headers['x-api-key']) {
    await apiKeyVerify(request)
  } else {
    await server.verifyUser(request, reply)
  }
}

export const isAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  await getCredential(server, request, reply)
}

export const isAdmin = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  await getCredential(server, request, reply)
  if (!request.user.isAdmin) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
    })
  }
}

export const maybeAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    await getCredential(server, request, reply)
  } catch (error) {
    // Ignore
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyUser: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
