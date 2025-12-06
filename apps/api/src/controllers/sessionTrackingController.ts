import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const SESSION_TTL = 300 // 5 minutes

interface TrackSessionBody {
  session_id: string
}

interface IsSessionActiveQuery {
  user_id: string
  session_id: string
}

export const trackSessionView = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { session_id } = request.body as TrackSessionBody
  const userId = request.user.userId

  server.log.info(
    {
      userId: userId?.toString(),
      sessionId: session_id,
      redis: Boolean(server.redis),
    },
    '[TRACK-VIEW] received request',
  )

  if (!server.redis) {
    server.log.warn('[TRACK-VIEW] redis unavailable; skipping set')
    return reply.status(200).send({
      tracked: false,
      reason: 'redis_unavailable',
    })
  }

  try {
    const key = `${server.redisEnvPrefix}:active_sessions:${userId}`
    await server.redis.sadd(key, session_id)
    await server.redis.expire(key, SESSION_TTL)

    server.log.info(
      { userId: userId?.toString(), sessionId: session_id },
      '[TRACK-VIEW] marked active',
    )

    return reply.status(200).send({ tracked: true })
  } catch (error) {
    server.log.error(
      { err: error, userId: userId?.toString(), sessionId: session_id },
      '[TRACK-VIEW] redis error',
    )
    return reply.status(500).send({
      tracked: false,
      reason: 'redis_error',
      error: String(error),
    })
  }
}

export const untrackSessionView = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { session_id } = request.body as TrackSessionBody
  const userId = request.user.userId

  server.log.info(
    {
      userId: userId?.toString(),
      sessionId: session_id,
      redis: Boolean(server.redis),
    },
    '[UNTRACK-VIEW] received request',
  )

  if (!server.redis) {
    server.log.warn('[UNTRACK-VIEW] redis unavailable; skipping remove')
    return reply.status(200).send({
      tracked: false,
      reason: 'redis_unavailable',
    })
  }

  try {
    const key = `${server.redisEnvPrefix}:active_sessions:${userId}`
    await server.redis.srem(key, session_id)

    server.log.info(
      { userId: userId?.toString(), sessionId: session_id },
      '[UNTRACK-VIEW] cleared active',
    )

    return reply.status(200).send({ tracked: true })
  } catch (error) {
    server.log.error(
      { err: error, userId: userId?.toString(), sessionId: session_id },
      '[UNTRACK-VIEW] redis error',
    )
    return reply.status(500).send({
      tracked: false,
      reason: 'redis_error',
      error: String(error),
    })
  }
}

export const isSessionActive = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { user_id, session_id } = request.query as IsSessionActiveQuery

  if (!server.redis) {
    // Fallback: assume not active (will create notifications)
    // This is the safe default for local dev without Redis
    return reply.status(200).send({
      is_active: false,
      redis_available: false,
    })
  }

  try {
    const key = `${server.redisEnvPrefix}:active_sessions:${user_id}`
    const isActive = await server.redis.sismember(key, session_id)

    return reply.status(200).send({
      is_active: Boolean(isActive),
      redis_available: true,
    })
  } catch (error) {
    return reply.status(200).send({
      is_active: false,
      redis_available: false,
      error: String(error),
    })
  }
}
