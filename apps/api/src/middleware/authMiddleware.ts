import { eden2EarlyAccessCheck, isAllowedAccess } from '../lib/authorization'
import { checkUserFlags } from '../lib/data'
import { ApiKey } from '../models/ApiKey'
import { User } from '../models/Creator'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const apiKeyVerify = async (
  server: FastifyInstance,
  request: FastifyRequest,
  isEden2?: boolean,
) => {
  if (!request.headers['x-api-key']) {
    throw new Error('Missing API key')
  }

  const apiKey = await ApiKey.findOne({
    apiKey: request.headers['x-api-key'],
  })

  if (!apiKey) {
    throw new Error('Invalid API key provided')
  }

  const user = await User.findById(apiKey.user)

  if (!user) {
    throw new Error('User not found')
  }

  if (!apiKey.character && !isAllowedAccess(server, user.userId)) {
    throw new Error('User not allowed')
  }

  request.user = {
    userId: user._id,
    character: apiKey.character,
    subscriptionTier: user.subscriptionTier || SubscriptionTier.Free,
    featureFlags: user.featureFlags || [],
    isAdmin: user.isAdmin || false,
  }

  if (isEden2 && !eden2EarlyAccessCheck(request)) {
    throw new Error('User not whitelisted for "Eden2 - Early Access"')
  }
}

const getCredential = async (
  server: FastifyInstance,
  request: FastifyRequest,
  isEden2?: boolean,
  // reply: FastifyReply,
) => {
  if (request.headers['x-api-key']) {
    await apiKeyVerify(server, request, isEden2)
  } else {
    await server.verifyUser(request, isEden2)
  }
}

export const isAuthEden2 = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
  requiredFeatureFlags?: FeatureFlag[],
) => {
  try {
    await getCredential(server, request, true)
    if (requiredFeatureFlags) {
      if (
        !request.user.featureFlags.some(flag =>
          requiredFeatureFlags.includes(flag),
        )
      ) {
        throw new Error(
          `Missing required feature flags: ${requiredFeatureFlags.join(', ')}`,
        )
      }
    }
  } catch (error: any) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message,
    })
  }
}

export const isAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    await getCredential(server, request)
  } catch (error: any) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message,
    })
  }
}

export const isAdmin = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    await getCredential(server, request)
  } catch (error: any) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message,
    })
  }
  if (!request.user.isAdmin) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
    })
  }
}

export const isCharacter = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  try {
    await getCredential(server, request)
  } catch (error: any) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: error.message,
    })
  }
  if (!request.user.character) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Unauthorized',
    })
  }
}

export const hasMinimumSubscriptionTier = (
  request: FastifyRequest,
  minimumTier: SubscriptionTier,
) => {
  if (!request.user) {
    return false
  }
  return (
    request.user.subscriptionTier >= minimumTier ||
    // Admin user and preview user are equivalent to having the highest tier
    request.user.isAdmin ||
    checkUserFlags(request.user.featureFlags, FeatureFlag.Preview)
  )
}

export const hasFeatureFlag = (
  request: FastifyRequest,
  featureFlag: FeatureFlag,
) => {
  return checkUserFlags(request.user.featureFlags, featureFlag)
}

// used for public routes that may contain elements with extra data when authed (think like count on a feed)
export const maybeAuthEden2 = async (
  server: FastifyInstance,
  request: FastifyRequest,
) => {
  try {
    await getCredential(server, request, true)
  } catch (error) {
    // Ignore
  }
}

export const maybeAuth = async (
  server: FastifyInstance,
  request: FastifyRequest,
) => {
  try {
    await getCredential(server, request)
  } catch (error) {
    // Ignore
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyUser: (request: FastifyRequest, isEden2?: boolean) => Promise<void>
  }
}
