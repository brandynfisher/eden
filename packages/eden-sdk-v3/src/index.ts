import type {
  components as ArtifactsComponents,
  paths as ArtifactsPaths,
} from './generated/artifacts-v3'
import type { paths as MannaPaths } from './generated/manna-v3'
import type { paths as SessionsPaths } from './generated/sessions-v3'
import createClient, { type ClientOptions } from 'openapi-fetch'

export type {
  components as SessionsComponents,
  paths as SessionsPaths,
} from './generated/sessions-v3'
export type {
  components as ArtifactsComponents,
  paths as ArtifactsPaths,
} from './generated/artifacts-v3'
export type {
  components as MannaComponents,
  paths as MannaPaths,
} from './generated/manna-v3'

export type SessionsV3Client = ReturnType<typeof createClient<SessionsPaths>>
export type ArtifactsV3Client = ReturnType<typeof createClient<ArtifactsPaths>>
export type MannaV3Client = ReturnType<typeof createClient<MannaPaths>>

export type {
  SessionPromptRequest,
  SessionPromptResponse,
  SessionStreamEvent,
  EdenClientOptions,
  ArtifactCreateRequest,
  ArtifactUpdateRequest,
  ArtifactPatchItemsRequest,
  ArtifactPermissionsUpdateRequest,
  ArtifactPermissionsResponse,
  ArtifactResponse,
  PaginatedArtifactsResponse,
  PaginatedArtifactsHistoryResponse,
  MannaVoucherRedeemRequest,
  MannaVoucherRedeemResponse,
} from './methods'

export type Artifact = ArtifactsComponents['schemas']['Artifact']
export type ArtifactHistoryEntry =
  ArtifactsComponents['schemas']['ArtifactHistoryEntry']

export const createSessionsV3Client = (options: ClientOptions = {}) =>
  createClient<SessionsPaths>(options)

export const createArtifactsV3Client = (options: ClientOptions = {}) =>
  createClient<ArtifactsPaths>(options)

export const createMannaV3Client = (options: ClientOptions = {}) =>
  createClient<MannaPaths>(options)

export { createEdenClient, createSessionsV3Api } from './methods'
