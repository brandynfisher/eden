import { searchCreationsCore } from '../controllers/v2/creationControllerV2'
import { verifyMcpToken } from '../lib/mcpTokens'
import { verifyApiKey } from '../middleware/authMiddleware'
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { randomUUID } from 'crypto'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'

const MCP_SCOPES = ['mcp:tools']
const MCP_VERSION = '1.0.0'

type ToolExtra = { authInfo?: AuthInfo }
type PingArgs = { message?: string }
type SearchArgs = {
  query: string
  agentId?: string
  userId?: string
  tool?: string
  page?: number
  limit?: number
}

const buildAuthInfo = (
  token: string,
  userId: string,
  apiKeyId?: string,
  tokenType?: string,
): AuthInfo => {
  return {
    token,
    clientId: userId,
    scopes: MCP_SCOPES,
    extra: {
      userId,
      apiKeyId,
      tokenType,
    },
  }
}

const getSessionId = (request: FastifyRequest) => {
  const header = request.headers['mcp-session-id']
  if (!header) {
    return undefined
  }
  return Array.isArray(header) ? header[0] : header
}

const getAuthToken = (request: FastifyRequest) => {
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

const isInitializePayload = (payload: unknown) => {
  if (Array.isArray(payload)) {
    return payload.some(item => isInitializeRequest(item))
  }
  return isInitializeRequest(payload)
}

const createMcpServer = (server: FastifyInstance) => {
  const mcp = new McpServer({
    name: 'eden-mcp',
    version: MCP_VERSION,
  })

  const tool = (mcp as unknown as { tool: (...args: any[]) => void }).tool.bind(
    mcp,
  )

  const pingSchema = {
    message: z.string().optional(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_ping',
    'Simple MCP auth test tool for Eden.',
    pingSchema,
    async ({ message }: PingArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : null
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              ok: true,
              message: message || 'pong',
              userId: authUserId,
            }),
          },
        ],
      }
    },
  )

  const searchSchema = {
    query: z.string(),
    agentId: z.string().optional(),
    userId: z.string().optional(),
    tool: z.string().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_search_creations',
    'Search Eden creations with semantic embeddings.',
    searchSchema,
    async (args: SearchArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const result = await searchCreationsCore(server, {
        ...args,
        authUserId,
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      }
    },
  )

  return mcp
}

const resolveAuthInfo = async (server: FastifyInstance, token: string) => {
  const mcpToken = verifyMcpToken(server, token)
  if (mcpToken) {
    return buildAuthInfo(
      token,
      String(mcpToken.sub),
      mcpToken.apiKeyId,
      'mcp_delegation',
    )
  }

  const { apiKey, user } = await verifyApiKey(server, token)
  return buildAuthInfo(token, String(user._id), String(apiKey._id), 'api_key')
}

export const registerMcp = async (server: FastifyInstance) => {
  const transports = new Map<string, StreamableHTTPServerTransport>()

  const attachAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    const token = getAuthToken(request)
    if (!token) {
      return reply.status(401).send({ message: 'Missing auth token' })
    }

    try {
      const authInfo = await resolveAuthInfo(server, token)
      ;(request.raw as { auth?: AuthInfo }).auth = authInfo
    } catch (error) {
      return reply.status(401).send({ message: 'Invalid auth token' })
    }
  }

  const mcpPostHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const sessionId = getSessionId(request)
    const body = request.body

    try {
      let transport: StreamableHTTPServerTransport | undefined

      if (sessionId && transports.has(sessionId)) {
        transport = transports.get(sessionId)
      } else if (!sessionId && isInitializePayload(body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: id => {
            transports.set(id, transport!)
          },
        })

        transport.onclose = () => {
          const id = transport?.sessionId
          if (id && transports.has(id)) {
            transports.delete(id)
          }
        }

        const mcp = createMcpServer(server)
        await mcp.connect(transport)
        reply.hijack()
        await transport.handleRequest(request.raw, reply.raw, body)
        return
      } else {
        return reply.status(400).send({
          message: 'Bad Request: No valid session ID provided',
        })
      }

      if (!transport) {
        return reply.status(404).send({
          message: 'Invalid session ID',
        })
      }

      reply.hijack()
      await transport.handleRequest(request.raw, reply.raw, body)
    } catch (error) {
      request.log.error({ err: error }, 'Error handling MCP POST')
      if (!reply.sent) {
        return reply.status(500).send({ message: 'Internal server error' })
      }
    }
  }

  const mcpGetHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const sessionId = getSessionId(request)
    if (!sessionId || !transports.has(sessionId)) {
      return reply
        .status(400)
        .send({ message: 'Invalid or missing session ID' })
    }

    const transport = transports.get(sessionId)
    if (!transport) {
      return reply.status(404).send({ message: 'Invalid session ID' })
    }

    reply.hijack()
    await transport.handleRequest(request.raw, reply.raw)
  }

  const mcpDeleteHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    const sessionId = getSessionId(request)
    if (!sessionId || !transports.has(sessionId)) {
      return reply
        .status(400)
        .send({ message: 'Invalid or missing session ID' })
    }

    const transport = transports.get(sessionId)
    if (!transport) {
      return reply.status(404).send({ message: 'Invalid session ID' })
    }

    reply.hijack()
    await transport.handleRequest(request.raw, reply.raw)
  }

  server.post('/mcp', {
    preHandler: [(request, reply) => attachAuth(request, reply)],
    handler: mcpPostHandler,
  })

  server.get('/mcp', {
    preHandler: [(request, reply) => attachAuth(request, reply)],
    handler: mcpGetHandler,
  })

  server.delete('/mcp', {
    preHandler: [(request, reply) => attachAuth(request, reply)],
    handler: mcpDeleteHandler,
  })
}

export default registerMcp
