import { extractTraceHeaders } from '../../lib/traceHeaders'
import { isAuth } from '../../middleware/authMiddleware'
import registerOpenApiSchemas from '../../plugins/openapiSchemas'
import { SessionPromptRequest } from '@edenlabs/eden-sdk-v3'
import axios from 'axios'
import { randomUUID } from 'crypto'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'

const MAX_STREAMS_PER_USER = Number(
  process.env.SESSIONS_V3_MAX_STREAMS_PER_USER ?? 2,
)

const activeStreamsByUser = new Map<string, number>()

const sessionRoutesV3: FastifyPluginAsync = async server => {
  await server.register(registerOpenApiSchemas, { id: 'sessions-v3' })

  const sessionPreHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    await isAuth(server, request, reply)
  }

  server.post<{ Body: SessionPromptRequest }>(
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

  server.post<{ Body: SessionPromptRequest }>(
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
          429: { $ref: 'sessions-v3#/components/schemas/ErrorResponse' },
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
        return reply
          .status(429)
          .send({ message: 'Too many concurrent streams' })
      }

      activeStreamsByUser.set(userId, currentStreams + 1)
      const decrement = () => {
        const current = activeStreamsByUser.get(userId) ?? 1
        const next = Math.max(current - 1, 0)
        if (next === 0) {
          activeStreamsByUser.delete(userId)
        } else {
          activeStreamsByUser.set(userId, next)
        }
      }

      request.raw.on('close', decrement)
      request.raw.on('error', decrement)

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
        const stream = await axios.post(
          `${server.config.EDEN_COMPUTE_API_URL}/v3/sessions/prompt/stream`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
              ...traceHeaders,
            },
            responseType: 'stream',
          },
        )

        reply.raw.setHeader('Content-Type', 'text/event-stream')
        reply.raw.setHeader('Cache-Control', 'no-cache')
        reply.raw.setHeader('Connection', 'keep-alive')
        reply.raw.flushHeaders()

        stream.data.on('data', (chunk: Buffer) => {
          reply.raw.write(chunk)
        })

        stream.data.on('end', () => {
          reply.raw.end()
        })

        stream.data.on('error', (err: Error) => {
          server.log.error({ err }, '[v3] stream error')
          reply.raw.end()
        })
      } catch (error) {
        server.log.error({ err: error }, '[v3] Prompt stream failed')
        const message =
          axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'Failed to prompt session stream'
        reply.status(500).send({ message })
      }
    },
  )
}

export default sessionRoutesV3
