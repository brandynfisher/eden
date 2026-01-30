import type { paths as ArtifactsPaths } from './generated/artifacts-v3'
import type { paths as MannaPaths } from './generated/manna-v3'
import type { paths as SessionsPaths } from './generated/sessions-v3'
import createClient, { type ClientOptions } from 'openapi-fetch'

export type SessionsV3Client = ReturnType<typeof createClient<SessionsPaths>>
export type ArtifactsV3Client = ReturnType<typeof createClient<ArtifactsPaths>>
export type MannaV3Client = ReturnType<typeof createClient<MannaPaths>>

export const createSessionsV3Client = (options: ClientOptions = {}) =>
  createClient<SessionsPaths>(options)

export const createArtifactsV3Client = (options: ClientOptions = {}) =>
  createClient<ArtifactsPaths>(options)

export const createMannaV3Client = (options: ClientOptions = {}) =>
  createClient<MannaPaths>(options)
