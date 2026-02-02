import type { components as ArtifactsComponents } from './generated/artifacts-v3'

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

export type {
  SessionsV3Client,
  ArtifactsV3Client,
  MannaV3Client,
} from './clients'

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

export {
  createSessionsV3Client,
  createArtifactsV3Client,
  createMannaV3Client,
} from './clients'

export { createEdenClient, createSessionsV3Api } from './methods'
