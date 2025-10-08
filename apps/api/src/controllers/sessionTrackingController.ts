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
    `[SESSION TRACKING] Track view request: user=${userId}, session=${session_id}`,
  )

  if (!server.redis) {
    server.log.warn(
      '[SESSION TRACKING] ⚠️  Redis unavailable - cannot track session view',
    )
    return reply.status(200).send({
      tracked: false,
      reason: 'redis_unavailable',
    })
  }

  try {
    const key = `active_sessions:${userId}`
    await server.redis.sadd(key, session_id)
    await server.redis.expire(key, SESSION_TTL)

    // Log current active sessions for this user
    const activeSessions = await server.redis.smembers(key)
    server.log.info(
      `[SESSION TRACKING] ✓ Tracked: ${key} -> [${activeSessions.join(
        ', ',
      )}] (TTL: ${SESSION_TTL}s)`,
    )

    return reply.status(200).send({ tracked: true })
  } catch (error) {
    server.log.error(
      '[SESSION TRACKING] ❌ Error tracking session view:',
      error,
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
    `[SESSION TRACKING] Untrack view request: user=${userId}, session=${session_id}`,
  )

  if (!server.redis) {
    server.log.warn(
      '[SESSION TRACKING] ⚠️  Redis unavailable - cannot untrack session view',
    )
    return reply.status(200).send({
      tracked: false,
      reason: 'redis_unavailable',
    })
  }

  try {
    const key = `active_sessions:${userId}`
    await server.redis.srem(key, session_id)

    // Log remaining active sessions for this user
    const activeSessions = await server.redis.smembers(key)
    server.log.info(
      `[SESSION TRACKING] ✓ Untracked: ${key} -> [${activeSessions.join(
        ', ',
      )}] remaining`,
    )

    return reply.status(200).send({ tracked: true })
  } catch (error) {
    server.log.error(
      '[SESSION TRACKING] ❌ Error untracking session view:',
      error,
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

  server.log.info(
    `[SESSION TRACKING] Is active check: user=${user_id}, session=${session_id}`,
  )

  if (!server.redis) {
    // Fallback: assume not active (will create notifications)
    // This is the safe default for local dev without Redis
    server.log.warn(
      '[SESSION TRACKING] ⚠️  Redis unavailable - returning is_active=false (will create notification)',
    )
    return reply.status(200).send({
      is_active: false,
      redis_available: false,
    })
  }

  try {
    const key = `active_sessions:${user_id}`
    const isActive = await server.redis.sismember(key, session_id)

    server.log.info(
      `[SESSION TRACKING] ${
        isActive ? '👁️  User IS viewing' : '🔕 User NOT viewing'
      } - is_active=${isActive}`,
    )

    return reply.status(200).send({
      is_active: Boolean(isActive),
      redis_available: true,
    })
  } catch (error) {
    server.log.error(
      '[SESSION TRACKING] ❌ Error checking session activity:',
      error,
    )
    return reply.status(200).send({
      is_active: false,
      redis_available: false,
      error: String(error),
    })
  }
}
