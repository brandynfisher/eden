import { User } from '../../models/User'
import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

/**
 * Hardcoded tool configuration.
 * - waitForResponse: true = blocking (tool waits for result)
 * - waitForResponse: false = async (returns immediately, work happens in background)
 */
const TOOL_CONFIG: Record<
  string,
  { waitForResponse: boolean; timeoutSeconds: number }
> = {
  create: { waitForResponse: true, timeoutSeconds: 120 },
  display: { waitForResponse: true, timeoutSeconds: 30 },
  create_async: { waitForResponse: false, timeoutSeconds: 120 },
  eden_search: { waitForResponse: true, timeoutSeconds: 30 },
  lights: { waitForResponse: true, timeoutSeconds: 30 },
}

interface RealtimeToolRequest {
  tool_name: string
  args: Record<string, unknown>
  session_id: string
}

export const executeRealtimeTool = async (
  server: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const requestId = Math.random().toString(36).substring(7)
  server.log.info(
    `[Realtime Tool ${requestId}] ========== FASTIFY INCOMING ==========`,
  )

  try {
    const { userId } = request.user || {}
    server.log.info(
      `[Realtime Tool ${requestId}] User ID: ${userId || 'MISSING'}`,
    )

    if (!userId) {
      server.log.error(
        `[Realtime Tool ${requestId}] ERROR: User missing from request`,
      )
      return reply.status(401).send({
        message: 'User missing from request',
      })
    }

    const { tool_name, args, session_id } = request.body as RealtimeToolRequest

    server.log.info(`[Realtime Tool ${requestId}] Tool: ${tool_name}`)
    server.log.info(`[Realtime Tool ${requestId}] Session: ${session_id}`)
    server.log.info(
      `[Realtime Tool ${requestId}] Args: ${JSON.stringify(args)}`,
    )
    server.log.info(
      `[Realtime Tool ${requestId}] Available tools: ${Object.keys(
        TOOL_CONFIG,
      ).join(', ')}`,
    )

    // Validate tool name
    const toolConfig = TOOL_CONFIG[tool_name]
    if (!toolConfig) {
      server.log.error(
        `[Realtime Tool ${requestId}] ERROR: Unknown tool "${tool_name}"`,
      )
      return reply.status(400).send({
        message: `Unknown tool: ${tool_name}`,
      })
    }
    server.log.info(
      `[Realtime Tool ${requestId}] Tool config: waitForResponse=${toolConfig.waitForResponse}, timeout=${toolConfig.timeoutSeconds}s`,
    )

    if (!session_id) {
      server.log.error(`[Realtime Tool ${requestId}] ERROR: Missing session_id`)
      return reply.status(400).send({
        message: 'Missing session_id',
      })
    }

    // Verify user exists
    const userDocument = await User.findById(userId)
    if (!userDocument) {
      server.log.error(`[Realtime Tool ${requestId}] ERROR: User not found`)
      return reply.status(404).send({
        message: 'User not found',
      })
    }
    server.log.info(
      `[Realtime Tool ${requestId}] User verified: ${
        userDocument.username || userDocument.email
      }`,
    )

    // Call Eve Compute API
    const eveUrl = `${server.config.EDEN_COMPUTE_API_URL}/realtime/tool`
    const evePayload = {
      tool_name,
      args,
      user_id: userId,
      session_id,
      wait_for_response: toolConfig.waitForResponse,
      timeout_seconds: toolConfig.timeoutSeconds,
    }

    server.log.info(`[Realtime Tool ${requestId}] Calling Eve: ${eveUrl}`)
    server.log.info(
      `[Realtime Tool ${requestId}] Eve payload: ${JSON.stringify(evePayload)}`,
    )

    const startTime = Date.now()
    const eveResponse = await axios.post(eveUrl, evePayload, {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
      timeout: (toolConfig.timeoutSeconds + 10) * 1000, // Add buffer for network
    })
    const elapsed = Date.now() - startTime

    server.log.info(
      `[Realtime Tool ${requestId}] Eve response status: ${eveResponse.status} (${elapsed}ms)`,
    )
    server.log.info(
      `[Realtime Tool ${requestId}] Eve response data: ${JSON.stringify(
        eveResponse.data,
      )}`,
    )
    server.log.info(
      `[Realtime Tool ${requestId}] ========== FASTIFY COMPLETE ==========`,
    )

    return reply.status(200).send(eveResponse.data)
  } catch (e) {
    const error = e as {
      response?: { data?: unknown; status?: number }
      message?: string
      code?: string
    }

    server.log.error(
      `[Realtime Tool ${requestId}] EXCEPTION: ${error.message || e}`,
    )
    server.log.error(
      `[Realtime Tool ${requestId}] Error code: ${error.code || 'N/A'}`,
    )

    if (error.response) {
      const status = error.response.status || 500
      const message =
        typeof error.response.data === 'object'
          ? (error.response.data as { message?: string }).message ||
            'Eve API error'
          : 'Eve API error'

      server.log.error(
        `[Realtime Tool ${requestId}] Eve error status: ${status}`,
      )
      server.log.error(
        `[Realtime Tool ${requestId}] Eve error data: ${JSON.stringify(
          error.response.data,
        )}`,
      )
      return reply.status(status).send({ message })
    }

    server.log.error(`[Realtime Tool ${requestId}] Non-response error: ${e}`)
    return reply.status(500).send({
      message: e instanceof Error ? e.message : 'Unknown error',
    })
  }
}
