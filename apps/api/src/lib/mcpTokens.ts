import type { Config } from '../plugins/config'
import { FastifyInstance } from 'fastify'

export const MCP_TOKEN_SCOPE = 'mcp:tools'
export const MCP_TOKEN_TYPE = 'mcp_delegation'

export type McpTokenPayload = {
  sub: string
  scope: string[]
  typ: string
  apiKeyId?: string
}

const normalizeScope = (scope: unknown): string[] => {
  if (Array.isArray(scope)) {
    return scope.filter(item => typeof item === 'string')
  }
  if (typeof scope === 'string') {
    return [scope]
  }
  return []
}

const clampTtlSeconds = (ttlSeconds: number) => {
  const min = 60
  const max = 3600
  return Math.max(min, Math.min(ttlSeconds, max))
}

export const signMcpToken = (
  server: FastifyInstance,
  userId: string,
  ttlSeconds?: number,
) => {
  const config = server.config as Config
  const expiresIn = clampTtlSeconds(ttlSeconds ?? config.MCP_TOKEN_TTL_SECONDS)

  const payload: McpTokenPayload = {
    sub: userId,
    scope: [MCP_TOKEN_SCOPE],
    typ: MCP_TOKEN_TYPE,
  }

  const sign = server.jwt.sign as (
    payload: unknown,
    options?: { expiresIn?: number },
  ) => string

  const token = sign(payload, {
    expiresIn,
  })

  return {
    token,
    expiresIn,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  }
}

export const verifyMcpToken = (
  server: FastifyInstance,
  token: string,
): McpTokenPayload | null => {
  try {
    const payload = server.jwt.verify<McpTokenPayload>(token)
    if (!payload || payload.typ !== MCP_TOKEN_TYPE) {
      return null
    }

    const scopes = normalizeScope(payload.scope)
    if (!scopes.includes(MCP_TOKEN_SCOPE)) {
      return null
    }

    if (!payload.sub) {
      return null
    }

    return {
      ...payload,
      scope: scopes,
    }
  } catch (error) {
    return null
  }
}
