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
  try {
    const { userId } = request.user || {}
    if (!userId) {
      return reply.status(401).send({
        message: 'User missing from request',
      })
    }

    const { tool_name, args, session_id } = request.body as RealtimeToolRequest

    // Validate tool name
    const toolConfig = TOOL_CONFIG[tool_name]
    if (!toolConfig) {
      return reply.status(400).send({
        message: `Unknown tool: ${tool_name}`,
      })
    }

    if (!session_id) {
      return reply.status(400).send({
        message: 'Missing session_id',
      })
    }

    // Verify user exists
    const userDocument = await User.findById(userId)
    if (!userDocument) {
      return reply.status(404).send({
        message: 'User not found',
      })
    }

    // Call Eve Compute API
    const eveResponse = await axios.post(
      `${server.config.EDEN_COMPUTE_API_URL}/realtime/tool`,
      {
        tool_name,
        args,
        user_id: userId,
        session_id,
        wait_for_response: toolConfig.waitForResponse,
        timeout_seconds: toolConfig.timeoutSeconds,
      },
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
        timeout: (toolConfig.timeoutSeconds + 10) * 1000, // Add buffer for network
      },
    )

    return reply.status(200).send(eveResponse.data)
  } catch (e) {
    const error = e as { response?: { data?: unknown; status?: number } }

    if (error.response) {
      const status = error.response.status || 500
      const message =
        typeof error.response.data === 'object'
          ? (error.response.data as { message?: string }).message ||
            'Eve API error'
          : 'Eve API error'

      server.log.error(
        `[Realtime Tool] Eve error: ${JSON.stringify(error.response.data)}`,
      )
      return reply.status(status).send({ message })
    }

    server.log.error(`[Realtime Tool] Error: ${e}`)
    return reply.status(500).send({
      message: e instanceof Error ? e.message : 'Unknown error',
    })
  }
}
