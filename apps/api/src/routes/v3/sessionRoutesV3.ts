import { extractTraceHeaders } from '../../lib/traceHeaders'
import { isAuth } from '../../middleware/authMiddleware'
import registerSessionsV3Schemas from '../../plugins/sessionsV3Schemas'
import axios from 'axios'
import { randomUUID } from 'crypto'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

const MAX_STREAMS_PER_USER = Number(
  process.env.SESSIONS_V3_MAX_STREAMS_PER_USER ?? 2,
)

type SessionPromptRequestBody = {
  session_run_id?: string
  session_id?: string
  actor_agent_ids?: string[]
  thinking?: boolean
  creation?: {
    agent_ids: string[]
  }
  message: {
    content: string
    attachments?: string[]
  }
}

const activeStreamsByUser = new Map<string, number>()

const sessionRoutesV3: FastifyPluginAsync = async server => {
  await server.register(registerSessionsV3Schemas)

  const sessionPreHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    await isAuth(server, request, reply)
  }

  server.post<{ Body: SessionPromptRequestBody }>(
    '/v3/sessions/prompt',
    {
      preHandler: sessionPreHandler,
      schema: {
        tags: ['SessionsV3'],
        summary: 'Prompt session (v3)',
        security: [{ apiKey: [] }],
        body: { $ref: 'sessions-v3#/components/schemas/SessionPromptRequest' },
        response: {
          200: {
            $ref: 'sessions-v3#/components/schemas/SessionPromptResponse',
          },
          400: { $ref: 'sessions-v3#/components/schemas/ErrorResponse' },
          401: { $ref: 'sessions-v3#/components/schemas/ErrorResponse' },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId?.toString()
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized' })
      }

      const traceHeaders = extractTraceHeaders(request)

      const sessionRunId = request.body.session_run_id ?? randomUUID()
      const payload = {
        session_run_id: sessionRunId,
        session_id: request.body.session_id,
        actor_agent_ids: request.body.actor_agent_ids,
        thinking: request.body.thinking,
        message: {
          content: request.body.message.content,
          attachments: request.body.message.attachments ?? [],
        },
        user_id: userId,
        api_key_id: request.user?.apiKeyId,
        creation_args: request.body.creation
          ? { agent_ids: request.body.creation.agent_ids }
          : undefined,
      }

      try {
        const response = await axios.post(
          `${server.config.EDEN_COMPUTE_API_URL}/v3/sessions/prompt`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
              ...traceHeaders,
            },
          },
        )

        const responseData = response.data || {}
        if (!responseData.session_run_id) {
          responseData.session_run_id = sessionRunId
        }
        return reply.status(200).send(responseData)
      } catch (error) {
        server.log.error({ err: error }, '[v3] Prompt session failed')
        const message =
          axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'Failed to prompt session'
        return reply.status(500).send({ message })
      }
    },
  )

  server.post<{ Body: SessionPromptRequestBody }>(
    '/v3/sessions/prompt/stream',
    {
      preHandler: sessionPreHandler,
      schema: {
        tags: ['SessionsV3'],
        summary: 'Prompt session (v3, streaming)',
        security: [{ apiKey: [] }],
        body: { $ref: 'sessions-v3#/components/schemas/SessionPromptRequest' },
        response: {
          400: { $ref: 'sessions-v3#/components/schemas/ErrorResponse' },
          401: { $ref: 'sessions-v3#/components/schemas/ErrorResponse' },
        },
      },
    },
    async (request, reply) => {
      const userId = request.user?.userId?.toString()
      if (!userId) {
        return reply.status(401).send({ message: 'Unauthorized' })
      }

      const currentStreams = activeStreamsByUser.get(userId) ?? 0
      if (currentStreams >= MAX_STREAMS_PER_USER) {
        return reply.status(429).send({
          message: 'Too many concurrent session streams',
        })
      }

      activeStreamsByUser.set(userId, currentStreams + 1)

      const traceHeaders = extractTraceHeaders(request)

      const sessionRunId = request.body.session_run_id ?? randomUUID()
      const payload = {
        session_run_id: sessionRunId,
        session_id: request.body.session_id,
        actor_agent_ids: request.body.actor_agent_ids,
        thinking: request.body.thinking,
        message: {
          content: request.body.message.content,
          attachments: request.body.message.attachments ?? [],
        },
        user_id: userId,
        api_key_id: request.user?.apiKeyId,
        creation_args: request.body.creation
          ? { agent_ids: request.body.creation.agent_ids }
          : undefined,
        stream: true,
      }

      const abortController = new AbortController()
      let cleanedUp = false

      const cleanupStream = () => {
        if (cleanedUp) return
        cleanedUp = true
        const nextCount = (activeStreamsByUser.get(userId) ?? 1) - 1
        if (nextCount <= 0) {
          activeStreamsByUser.delete(userId)
        } else {
          activeStreamsByUser.set(userId, nextCount)
        }
        abortController.abort()
      }

      const safeWrite = (chunk: Buffer | string) => {
        if (cleanedUp || reply.raw.destroyed || reply.raw.writableEnded) {
          return
        }
        try {
          reply.raw.write(chunk)
        } catch (err) {
          server.log.warn({ err }, '[v3] stream write failed')
          cleanupStream()
        }
      }

      const safeEnd = () => {
        if (reply.raw.destroyed || reply.raw.writableEnded) {
          cleanupStream()
          return
        }
        try {
          reply.raw.end()
        } catch (err) {
          server.log.warn({ err }, '[v3] stream end failed')
        } finally {
          cleanupStream()
        }
      }

      request.raw.on('close', cleanupStream)
      request.raw.on('aborted', cleanupStream)
      reply.raw.on('close', cleanupStream)
      reply.raw.on('error', err => {
        server.log.warn({ err }, '[v3] reply stream error')
        cleanupStream()
      })

      const originHeader = request.headers.origin ?? '*'
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': originHeader,
        'Access-Control-Allow-Credentials': 'true',
        Vary: 'Origin',
      })
      reply.raw.setTimeout(0)
      reply.hijack()

      try {
        const upstream = await axios.post(
          `${server.config.EDEN_COMPUTE_API_URL}/v3/sessions/prompt/stream`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
              ...traceHeaders,
            },
            responseType: 'stream',
            signal: abortController.signal,
          },
        )

        upstream.data.on('data', (chunk: Buffer) => {
          safeWrite(chunk)
        })

        upstream.data.on('end', () => {
          safeEnd()
        })

        upstream.data.on('error', (streamError: Error) => {
          safeWrite(
            `data: ${JSON.stringify({
              event: 'error',
              data: { error: streamError.message },
            })}\n\n`,
          )
          safeEnd()
        })
      } catch (error) {
        server.log.error({ err: error }, '[v3] Prompt stream failed')
        safeWrite(
          `data: ${JSON.stringify({
            event: 'error',
            data: { error: 'Failed to establish stream' },
          })}\n\n`,
        )
        safeEnd()
      }
    },
  )
}

export default sessionRoutesV3
