import axios from 'axios'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

interface AgentPromptsExtractionRequest {
  session_id: string
  agent_name?: string
}

export const extractAgentPrompts = async (
  server: FastifyInstance,
  request: FastifyRequest<{ Body: AgentPromptsExtractionRequest }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user || {}
  if (!userId) {
    return reply.status(400).send({
      message: 'User missing from request',
    })
  }

  const { session_id, agent_name } = request.body

  if (!session_id) {
    return reply.status(400).send({
      message: 'session_id is required',
    })
  }

  const modalRequest = {
    endpoint: `${server.config.EDEN_COMPUTE_API_URL}/agent_creation/extract_prompts`,
    data: {
      user_id: userId,
      session_id,
      agent_name,
    },
  }

  server.log.info(
    `[extract_prompts] Starting request to Modal for session ${session_id}`,
  )
  const startTime = Date.now()

  try {
    const modalResponse = await axios.post(
      modalRequest.endpoint,
      modalRequest.data,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
        timeout: 180000, // 3 minute timeout to match Next.js
      },
    )

    const duration = Date.now() - startTime
    server.log.info(
      `[extract_prompts] Modal request completed in ${duration}ms`,
    )

    return reply.send(modalResponse.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const duration = Date.now() - startTime
      server.log.error(
        `[extract_prompts] Modal request failed after ${duration}ms: ${error.message}`,
      )
      if (error.code === 'ECONNABORTED') {
        server.log.error(
          `[extract_prompts] Request timed out after ${duration}ms`,
        )
      }
      return reply.status(error.response?.status || 500).send({
        message:
          error.response?.data?.message || 'Agent prompts extraction failed',
      })
    }

    server.log.error(`[extract_prompts] Unexpected error: ${error}`)
    return reply.status(500).send({
      message: 'Internal server error',
    })
  }
}
