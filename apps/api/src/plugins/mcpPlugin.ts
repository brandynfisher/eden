import { searchCreationsCore } from '../controllers/v2/creationControllerV2'
import {
  createArtifactV3Core,
  deleteArtifactV3Core,
  getArtifactPermissionsV3Core,
  getArtifactV3Core,
  listArtifactHistoryV3Core,
  listArtifactsV3Core,
  patchArtifactItemsV3Core,
  updateArtifactPermissionsV3Core,
  updateArtifactV3Core,
} from '../controllers/v3/artifactControllerV3'
import { verifyMcpToken } from '../lib/mcpTokens'
import { verifyApiKey } from '../middleware/authMiddleware'
import { ArtifactPermissionLevelV3 } from '../models/v3/ArtifactPermissionV3'
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

type ArtifactListArgs = {
  ownerId?: string
  type?: string
  sessionId?: string
  page?: number
  limit?: number
  orderBy?: string
  direction?: number
}

type ArtifactGetArgs = {
  artifactId: string
}

type ArtifactCreateArgs = {
  title: string
  type: string
  public?: boolean
  session?: string
  content?: string
  items?: Record<string, unknown>
}

type ArtifactUpdateArgs = {
  artifactId: string
  title?: string
  type?: string
  public?: boolean
  session?: string | null
  content?: string
  items?: Record<string, unknown>
}

type ArtifactPatchItemsArgs = {
  artifactId: string
  set?: Record<string, unknown>
  unset?: string[]
  reason?: string
}

type ArtifactPermissionsArgs = {
  artifactId: string
}

type ArtifactUpdatePermissionsArgs = {
  artifactId: string
  permissions: Array<{
    subjectId: string
    level: ArtifactPermissionLevelV3
    key?: string
  }>
}

type ArtifactHistoryArgs = {
  artifactId: string
  page?: number
  limit?: number
  orderBy?: string
  direction?: number
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

const parseMaybeJson = <T>(value: unknown): T | undefined => {
  if (!value) {
    return undefined
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch (_error) {
      return undefined
    }
  }
  return value as T
}

const flattenItems = (
  items: Record<string, unknown>,
  prefix = '',
  out: Record<string, unknown> = {},
) => {
  for (const [key, value] of Object.entries(items)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenItems(value as Record<string, unknown>, path, out)
    } else {
      out[path] = value as unknown
    }
  }
  return out
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

  const artifactListSchema = {
    ownerId: z.string().optional(),
    type: z.string().optional(),
    sessionId: z.string().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    orderBy: z.string().optional(),
    direction: z.number().int().optional(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_list',
    'List Eden artifacts (V3).',
    artifactListSchema,
    async (args: ArtifactListArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const result = await listArtifactsV3Core({
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

  const artifactGetSchema = {
    artifactId: z.string(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_get',
    'Get an Eden artifact (V3).',
    artifactGetSchema,
    async (args: ArtifactGetArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const result = await getArtifactV3Core({
        artifactId: args.artifactId,
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

  const artifactCreateSchema = {
    title: z.string(),
    type: z.string(),
    public: z.boolean().optional(),
    session: z.string().optional(),
    content: z.string().optional(),
    items: z.record(z.any()).optional(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_create',
    'Create an Eden artifact (V3).',
    artifactCreateSchema,
    async (args: ArtifactCreateArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const result = await createArtifactV3Core({
        ...args,
        items:
          parseMaybeJson<Record<string, unknown>>(args.items) ?? args.items,
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

  const artifactUpdateSchema = {
    artifactId: z.string(),
    title: z.string().optional(),
    type: z.string().optional(),
    public: z.boolean().optional(),
    session: z.union([z.string(), z.null()]).optional(),
    content: z.string().optional(),
    items: z.record(z.any()).optional(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_update',
    'Update an Eden artifact (V3).',
    artifactUpdateSchema,
    async (args: ArtifactUpdateArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const { content, items, ...updateArgs } = args
      const hasMetadataUpdates =
        updateArgs.title !== undefined ||
        updateArgs.type !== undefined ||
        updateArgs.public !== undefined ||
        updateArgs.session !== undefined

      let result: any | undefined
      if (hasMetadataUpdates) {
        result = await updateArtifactV3Core({
          ...updateArgs,
          authUserId,
        })
      }

      if (content !== undefined || items !== undefined) {
        const parsedItems =
          parseMaybeJson<Record<string, unknown>>(items) ?? items
        const flattenedItems = parsedItems ? flattenItems(parsedItems) : {}
        const set = {
          ...(content !== undefined ? { content } : {}),
          ...flattenedItems,
        }
        result = await patchArtifactItemsV3Core({
          artifactId: args.artifactId,
          set,
          authUserId,
        })
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result ?? {}),
          },
        ],
      }
    },
  )

  const artifactDeleteSchema = {
    artifactId: z.string(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_delete',
    'Delete an Eden artifact (V3).',
    artifactDeleteSchema,
    async (args: ArtifactGetArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const result = await deleteArtifactV3Core({
        artifactId: args.artifactId,
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

  const artifactPatchSchema = {
    artifactId: z.string(),
    set: z.record(z.any()).optional(),
    unset: z.array(z.string()).optional(),
    reason: z.string().optional(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_patch_items',
    'Patch items for an Eden artifact (V3).',
    artifactPatchSchema,
    async (args: ArtifactPatchItemsArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const result = await patchArtifactItemsV3Core({
        ...args,
        set: parseMaybeJson<Record<string, unknown>>(args.set) ?? args.set,
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

  const artifactPermissionsSchema = {
    artifactId: z.string(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_get_permissions',
    'Get permissions for an Eden artifact (V3).',
    artifactPermissionsSchema,
    async (args: ArtifactPermissionsArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const result = await getArtifactPermissionsV3Core({
        artifactId: args.artifactId,
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

  const artifactUpdatePermissionsSchema = {
    artifactId: z.string(),
    permissions: z.array(
      z.object({
        subjectId: z.string(),
        level: z.nativeEnum(ArtifactPermissionLevelV3),
        key: z.string().optional(),
      }),
    ),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_update_permissions',
    'Update permissions for an Eden artifact (V3).',
    artifactUpdatePermissionsSchema,
    async (args: ArtifactUpdatePermissionsArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const parsedPermissions =
        parseMaybeJson<ArtifactUpdatePermissionsArgs['permissions']>(
          args.permissions,
        ) ?? args.permissions
      const normalizedPermissions = parsedPermissions.map(permission => ({
        ...permission,
        level: permission.level as ArtifactPermissionLevelV3,
      }))
      const result = await updateArtifactPermissionsV3Core({
        ...args,
        permissions: normalizedPermissions,
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

  const artifactHistorySchema = {
    artifactId: z.string(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    orderBy: z.string().optional(),
    direction: z.number().int().optional(),
  } as Record<string, z.ZodTypeAny>

  tool(
    'eden_artifacts_v3_history',
    'List edit history for an Eden artifact (V3).',
    artifactHistorySchema,
    async (args: ArtifactHistoryArgs, extra: ToolExtra) => {
      const authUserId =
        typeof extra?.authInfo?.extra?.userId === 'string'
          ? extra.authInfo.extra.userId
          : undefined
      const result = await listArtifactHistoryV3Core({
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
