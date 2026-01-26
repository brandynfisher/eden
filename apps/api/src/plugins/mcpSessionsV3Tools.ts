import axios from 'axios'
import { randomUUID } from 'crypto'
import type { FastifyInstance } from 'fastify'

type SessionPromptArgs = {
  session_run_id?: string
  session_id?: string
  actor_agent_ids?: string[]
  thinking?: boolean
  creation?: {
    agent_ids: string[]
  }
  message?: {
    content: string
    attachments?: string[]
  }
}

type SessionV3ToolInput = {
  method: string
  path: string
  args: Record<string, unknown>
  userId: string
  apiKeyId?: string
  server: FastifyInstance
}

export const callSessionsV3Tool = async ({
  method,
  path,
  args,
  userId,
  apiKeyId,
  server,
}: SessionV3ToolInput) => {
  if (method.toLowerCase() !== 'post') {
    throw new Error(`Unsupported method for sessions v3 MCP tool: ${method}`)
  }
  if (path.endsWith('/stream')) {
    throw new Error('Streaming MCP tools are not supported yet')
  }

  const requestArgs = args as SessionPromptArgs
  const sessionRunId = requestArgs.session_run_id ?? randomUUID()
  const payload = {
    session_run_id: sessionRunId,
    session_id: requestArgs.session_id,
    actor_agent_ids: requestArgs.actor_agent_ids,
    thinking: requestArgs.thinking,
    message: requestArgs.message
      ? {
          content: requestArgs.message.content,
          attachments: requestArgs.message.attachments ?? [],
        }
      : undefined,
    user_id: userId,
    api_key_id: apiKeyId,
    creation_args: requestArgs.creation
      ? { agent_ids: requestArgs.creation.agent_ids }
      : undefined,
  }

  const response = await axios.post(
    `${server.config.EDEN_COMPUTE_API_URL}${path}`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${server.config.EDEN_COMPUTE_API_KEY}`,
      },
    },
  )

  const responseData = response.data || {}
  if (!responseData.session_run_id) {
    responseData.session_run_id = sessionRunId
  }
  return responseData
}
