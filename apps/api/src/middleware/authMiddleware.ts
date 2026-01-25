import { isAllowedAccess } from '../lib/authorization'
import { checkUserFlags } from '../lib/data'
import { ApiKey, ApiKeyDocument } from '../models/ApiKey'
import { User, UserDocument } from '../models/User'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export interface ApiKeyAuthResult {
  apiKey: ApiKeyDocument
  user: UserDocument
  requestUser: FastifyRequest['user']
}

const getApiKeyFromRequest = (request: FastifyRequest) => {
  const apiKeyHeader = request.headers['x-api-key']
  if (apiKeyHeader) {
    return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader
  }

  const authHeader = request.headers.authorization
  if (!authHeader) {
    return undefined
  }

  const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader
  const match = authValue.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return undefined
  }

  return match[1].trim()
}

export const verifyApiKey = async (
  server: FastifyInstance,
  apiKeyValue?: string,
) => {
  if (!apiKeyValue) {
    throw new Error('Missing API key')
  }

  const apiKey = await ApiKey.findOne({
    apiKey: apiKeyValue,
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

  return {
    apiKey,
    user,
    requestUser: {
      userId: user._id,
      character: apiKey.character,
      subscriptionTier: user.subscriptionTier || SubscriptionTier.Free,
      highestMonthlySubscriptionTier:
        user.highestMonthlySubscriptionTier || SubscriptionTier.Free,
      featureFlags: user.featureFlags || [],
      isAdmin: user.isAdmin || false,
      apiKeyId: apiKey._id,
    },
  } satisfies ApiKeyAuthResult
}

const apiKeyVerify = async (
  server: FastifyInstance,
  request: FastifyRequest,
  apiKeyValue?: string,
) => {
  const key = apiKeyValue ?? getApiKeyFromRequest(request)
  const { requestUser } = await verifyApiKey(server, key)

  request.user = requestUser
}

const getCredential = async (
  server: FastifyInstance,
  request: FastifyRequest,
  // reply: FastifyReply,
) => {
  const apiKey = getApiKeyFromRequest(request)

  if (apiKey) {
    try {
      await apiKeyVerify(server, request, apiKey)
      return
    } catch (error) {
      if (!request.headers['x-api-key']) {
        await server.verifyUser(request)
        return
      }
      throw error
    }
  }

  await server.verifyUser(request)
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
  reply: FastifyReply,
  featureFlag: FeatureFlag,
) => {
  try {
    checkUserFlags(request.user.featureFlags, featureFlag)
    return true
  } catch (error) {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Forbidden',
    })
  }
}

// used for public routes that may contain elements with extra data when authed (think like count on a feed)
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
    verifyUser: (request: FastifyRequest) => Promise<void>
  }
}
