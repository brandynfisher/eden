import { isAllowedAccess } from '../lib/authorization'
import { checkUserFlags } from '../lib/data'
import { hasPreviewAccess } from '../lib/featureFlags'
import { ApiKey, ApiKeyDocument } from '../models/ApiKey'
import { User, UserDocument } from '../models/User'
import { FeatureFlag, SubscriptionTier } from '@edenlabs/eden-sdk'
import crypto from 'crypto'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const AUTH_CACHE_TTL_SEC = 60
const AUTH_NEG_CACHE_TTL_SEC = 30
const AUTH_CACHE_NEG_VALUE = '__null__'

const hashKey = (value: string) =>
  crypto.createHash('sha256').update(value).digest('hex').slice(0, 32)

// Returns:
//   T   — cache hit, value present
//   null — cache hit, negative-cached (DB returned null, don't re-query)
//   undefined — cache miss or Redis unavailable; caller should query DB
const authCacheGet = async <T>(
  server: FastifyInstance,
  cacheKey: string,
): Promise<T | null | undefined> => {
  if (!server.redis) return undefined
  try {
    const v = await server.redis.get(cacheKey)
    if (v === null) return undefined
    if (v === AUTH_CACHE_NEG_VALUE) return null
    return JSON.parse(v) as T
  } catch (err) {
    server.log.warn({ err, cacheKey }, 'auth cache read failed')
    return undefined
  }
}

const authCacheSet = async (
  server: FastifyInstance,
  cacheKey: string,
  value: unknown | null,
): Promise<void> => {
  if (!server.redis) return
  try {
    if (value === null) {
      await server.redis.setex(
        cacheKey,
        AUTH_NEG_CACHE_TTL_SEC,
        AUTH_CACHE_NEG_VALUE,
      )
    } else {
      await server.redis.setex(
        cacheKey,
        AUTH_CACHE_TTL_SEC,
        JSON.stringify(value),
      )
    }
  } catch (err) {
    server.log.warn({ err, cacheKey }, 'auth cache write failed')
  }
}

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

  // Cache the apiKey lookup keyed on a hash of the secret so the secret never
  // appears in Redis keys. Negative results (invalid keys) get a shorter TTL.
  const apiKeyCacheKey = `${server.redisEnvPrefix}:auth:apikey:${hashKey(
    apiKeyValue,
  )}`
  let apiKey = await authCacheGet<ApiKeyDocument>(server, apiKeyCacheKey)
  if (apiKey === undefined) {
    apiKey = (await ApiKey.findOne({
      apiKey: apiKeyValue,
    }).lean()) as ApiKeyDocument | null
    await authCacheSet(server, apiKeyCacheKey, apiKey)
  }

  if (!apiKey) {
    throw new Error('Invalid API key provided')
  }

  const userCacheKey = `${server.redisEnvPrefix}:auth:user:${apiKey.user}`
  let user = await authCacheGet<UserDocument>(server, userCacheKey)
  if (user === undefined) {
    user = (await User.findById(apiKey.user).lean()) as UserDocument | null
    await authCacheSet(server, userCacheKey, user)
  }
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
      // A character-scoped key belongs to a deployed agent, not a human admin.
      // Admin routes (e.g. /admin/manna/modify) gate only on `isAdmin`, so
      // letting a character key inherit its owner's admin bit means any agent
      // key could grant manna. Admin power requires a non-character key.
      isAdmin: (user.isAdmin && !apiKey.character) || false,
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
    hasPreviewAccess(request.user.featureFlags)
  )
}

export const hasFeatureFlag = (
  request: FastifyRequest,
  reply: FastifyReply,
  featureFlag: FeatureFlag,
) => {
  try {
    if (featureFlag === FeatureFlag.Preview) {
      if (!hasPreviewAccess(request.user.featureFlags)) {
        throw new Error('Feature flag not found')
      }
    } else {
      checkUserFlags(request.user.featureFlags, featureFlag)
    }
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
