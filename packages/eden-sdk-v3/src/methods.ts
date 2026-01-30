import {
  createArtifactsV3Client,
  createMannaV3Client,
  createSessionsV3Client,
} from './clients'
import type { components as ArtifactsComponents } from './generated/artifacts-v3'
import type { components as MannaComponents } from './generated/manna-v3'
import type { components as SessionsComponents } from './generated/sessions-v3'
import type { ClientOptions } from 'openapi-fetch'

export type SessionPromptRequest =
  SessionsComponents['schemas']['SessionPromptRequest']
export type SessionPromptResponse =
  SessionsComponents['schemas']['SessionPromptResponse']
export type SessionStreamEvent =
  SessionsComponents['schemas']['SessionStreamEvent']

export type ArtifactCreateRequest =
  ArtifactsComponents['schemas']['ArtifactCreateRequest']
export type ArtifactUpdateRequest =
  ArtifactsComponents['schemas']['ArtifactUpdateRequest']
export type ArtifactPatchItemsRequest =
  ArtifactsComponents['schemas']['ArtifactPatchItemsRequest']
export type ArtifactPermissionsUpdateRequest =
  ArtifactsComponents['schemas']['ArtifactPermissionsUpdateRequest']
export type ArtifactPermissionsResponse =
  ArtifactsComponents['schemas']['ArtifactPermissionsResponse']
export type ArtifactResponse =
  ArtifactsComponents['schemas']['ArtifactResponse']
export type PaginatedArtifactsResponse =
  ArtifactsComponents['schemas']['PaginatedArtifactsResponse']
export type PaginatedArtifactsHistoryResponse =
  ArtifactsComponents['schemas']['PaginatedArtifactsHistoryResponse']

export type MannaVoucherRedeemRequest =
  MannaComponents['schemas']['MannaVoucherRedeemRequest']
export type MannaVoucherRedeemResponse =
  MannaComponents['schemas']['MannaVoucherRedeemResponse']

export type EdenClientOptions = {
  baseUrl: string
  token?: string
  headers?: Record<string, string>
  getHeaders?: () => Record<string, string>
} & Omit<ClientOptions, 'baseUrl' | 'headers'>

export const createEdenClient = (options: EdenClientOptions) => {
  const baseUrl = options.baseUrl
  const makeHeaders = () => {
    const dynamic = options.getHeaders?.() ?? {}
    const staticHeaders = options.headers ?? {}
    const authHeader = options.token
      ? { Authorization: `Bearer ${options.token}` }
      : {}
    return {
      ...staticHeaders,
      ...authHeader,
      ...dynamic,
    }
  }

  const sessionsClient = createSessionsV3Client({
    baseUrl,
    ...options,
    headers: makeHeaders(),
  })

  const artifactsClient = createArtifactsV3Client({
    baseUrl,
    ...options,
    headers: makeHeaders(),
  })

  const mannaClient = createMannaV3Client({
    baseUrl,
    ...options,
    headers: makeHeaders(),
  })

  const sessions = {
    prompt: async (body: SessionPromptRequest) => {
      const { data, error } = await sessionsClient.POST('/v3/sessions/prompt', {
        body,
      })
      if (error) {
        throw error
      }
      return data as SessionPromptResponse
    },
    promptStream: async (body: SessionPromptRequest) => {
      const response = await fetch(`${baseUrl}/v3/sessions/prompt/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...makeHeaders(),
        },
        body: JSON.stringify(body),
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to start session stream')
      }
      return response
    },
  }

  const artifacts = {
    list: async (query?: {
      ownerId?: string
      type?: string
      sessionId?: string
      page?: number
      limit?: number
      orderBy?: string
      direction?: number
    }) => {
      const { data, error } = await artifactsClient.GET('/v3/artifacts', {
        params: {
          query,
        },
      })
      if (error) {
        throw error
      }
      return data as PaginatedArtifactsResponse
    },
    get: async (artifactId: string) => {
      const { data, error } = await artifactsClient.GET(
        '/v3/artifacts/{artifactId}',
        {
          params: {
            path: { artifactId },
          },
        },
      )
      if (error) {
        throw error
      }
      return data as ArtifactResponse
    },
    create: async (body: ArtifactCreateRequest) => {
      const { data, error } = await artifactsClient.POST('/v3/artifacts', {
        body,
      })
      if (error) {
        throw error
      }
      return data as ArtifactResponse
    },
    update: async (artifactId: string, body: ArtifactUpdateRequest) => {
      const { data, error } = await artifactsClient.PATCH(
        '/v3/artifacts/{artifactId}',
        {
          params: {
            path: { artifactId },
          },
          body,
        },
      )
      if (error) {
        throw error
      }
      return data as ArtifactResponse
    },
    patchItems: async (artifactId: string, body: ArtifactPatchItemsRequest) => {
      const { data, error } = await artifactsClient.PATCH(
        '/v3/artifacts/{artifactId}/items',
        {
          params: {
            path: { artifactId },
          },
          body,
        },
      )
      if (error) {
        throw error
      }
      return data as ArtifactResponse
    },
    delete: async (artifactId: string) => {
      const { data, error } = await artifactsClient.DELETE(
        '/v3/artifacts/{artifactId}',
        {
          params: {
            path: { artifactId },
          },
        },
      )
      if (error) {
        throw error
      }
      return data as { message?: string }
    },
    getPermissions: async (artifactId: string) => {
      const { data, error } = await artifactsClient.GET(
        '/v3/artifacts/{artifactId}/permissions',
        {
          params: {
            path: { artifactId },
          },
        },
      )
      if (error) {
        throw error
      }
      return data as ArtifactPermissionsResponse
    },
    updatePermissions: async (
      artifactId: string,
      body: ArtifactPermissionsUpdateRequest,
    ) => {
      const { data, error } = await artifactsClient.PUT(
        '/v3/artifacts/{artifactId}/permissions',
        {
          params: {
            path: { artifactId },
          },
          body,
        },
      )
      if (error) {
        throw error
      }
      return data as ArtifactPermissionsResponse
    },
    history: async (
      artifactId: string,
      query?: {
        page?: number
        limit?: number
        orderBy?: string
        direction?: number
      },
    ) => {
      const { data, error } = await artifactsClient.GET(
        '/v3/artifacts/{artifactId}/history',
        {
          params: {
            path: { artifactId },
            query,
          },
        },
      )
      if (error) {
        throw error
      }
      return data as PaginatedArtifactsHistoryResponse
    },
  }

  const manna = {
    redeemVoucher: async (body: MannaVoucherRedeemRequest) => {
      const { data, error } = await mannaClient.POST(
        '/v3/manna/vouchers/redeem',
        {
          body,
        },
      )
      if (error) {
        throw error
      }
      return data as MannaVoucherRedeemResponse
    },
  }

  return {
    sessions,
    artifacts,
    manna,
  }
}

export const createSessionsV3Api = createEdenClient
