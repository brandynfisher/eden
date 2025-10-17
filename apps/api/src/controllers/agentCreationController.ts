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

  try {
    const modalResponse = await axios.post(
      modalRequest.endpoint,
      modalRequest.data,
      {
        headers: {
          Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
        },
      },
    )

    return reply.send(modalResponse.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return reply.status(error.response?.status || 500).send({
        message:
          error.response?.data?.message || 'Agent prompts extraction failed',
      })
    }

    return reply.status(500).send({
      message: 'Internal server error',
    })
  }
}
