import { AxiosRequestConfig } from 'axios'
import { WebAPICallOptions, WebAPICallResult } from 'src/types'

export type ArtifactItemValueV3 = string | ArtifactItemsV3

export type ArtifactItemsV3 = {
  [key: string]: ArtifactItemValueV3
}

export type ArtifactV3 = {
  _id: string
  owner: string
  title: string
  type: string
  public: boolean
  session?: string | null
  originSession?: string | null
  items: ArtifactItemsV3
  createdAt: Date
  updatedAt: Date
  deleted?: boolean
}

export enum ArtifactPermissionLevelV3 {
  Viewer = 'viewer',
  Editor = 'editor',
  Owner = 'owner',
}

export type ArtifactPermissionV3 = {
  _id: string
  artifact: string
  subject:
    | string
    | {
        _id: string
        userId?: string
        username?: string
        userImage?: string
        type?: string
      }
  level: ArtifactPermissionLevelV3
  key?: string
  grantedAt: Date
}

export type ArtifactEditOperationV3 = {
  op: 'set' | 'unset'
  path: string
  value?: string
}

export type ArtifactEditV3 = {
  _id: string
  artifact: string
  actor: string
  patch: ArtifactEditOperationV3[]
  reason?: string
  createdAt: Date
}

export interface ArtifactsV3ListArguments extends WebAPICallOptions {
  ownerId?: string
  type?: string
  sessionId?: string
  page?: number
  limit?: number
  orderBy?: string
  direction?: number
}

export interface ArtifactsV3GetArguments extends WebAPICallOptions {
  artifactId: string
}

export interface ArtifactsV3CreateArguments extends WebAPICallOptions {
  title: string
  type: string
  public?: boolean
  session?: string
  items?: ArtifactItemsV3
  content?: string
}

export interface ArtifactsV3UpdateArguments extends WebAPICallOptions {
  artifactId: string
  title?: string
  type?: string
  public?: boolean
  session?: string | null
}

export interface ArtifactsV3PatchItemsArguments extends WebAPICallOptions {
  artifactId: string
  set?: Record<string, string | number | boolean>
  unset?: string[]
  reason?: string
}

export interface ArtifactsV3DeleteArguments extends WebAPICallOptions {
  artifactId: string
}

export interface ArtifactsV3GetPermissionsArguments extends WebAPICallOptions {
  artifactId: string
}

export interface ArtifactsV3UpdatePermissionsArguments
  extends WebAPICallOptions {
  artifactId: string
  permissions: Array<{
    subjectId: string
    level: ArtifactPermissionLevelV3
    key?: string
  }>
}

export interface ArtifactsV3HistoryArguments extends WebAPICallOptions {
  artifactId: string
  page?: number
  limit?: number
  orderBy?: string
  direction?: number
}

export const artifactsV3ListRequestConfig = (
  args: ArtifactsV3ListArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'v3/artifacts',
    params: args,
  }
}

export const artifactsV3GetRequestConfig = (
  args: ArtifactsV3GetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v3/artifacts/${args.artifactId}`,
  }
}

export const artifactsV3CreateRequestConfig = (
  args: ArtifactsV3CreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v3/artifacts',
    data: args,
  }
}

export const artifactsV3UpdateRequestConfig = (
  args: ArtifactsV3UpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v3/artifacts/${args.artifactId}`,
    data: args,
  }
}

export const artifactsV3PatchItemsRequestConfig = (
  args: ArtifactsV3PatchItemsArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v3/artifacts/${args.artifactId}/items`,
    data: args,
  }
}

export const artifactsV3DeleteRequestConfig = (
  args: ArtifactsV3DeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v3/artifacts/${args.artifactId}`,
  }
}

export const artifactsV3GetPermissionsRequestConfig = (
  args: ArtifactsV3GetPermissionsArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v3/artifacts/${args.artifactId}/permissions`,
  }
}

export const artifactsV3UpdatePermissionsRequestConfig = (
  args: ArtifactsV3UpdatePermissionsArguments,
): AxiosRequestConfig => {
  return {
    method: 'PUT',
    url: `v3/artifacts/${args.artifactId}/permissions`,
    data: {
      permissions: args.permissions,
    },
  }
}

export const artifactsV3HistoryRequestConfig = (
  args: ArtifactsV3HistoryArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v3/artifacts/${args.artifactId}/history`,
    params: args,
  }
}

export interface ArtifactsV3ListResponse extends WebAPICallResult {
  docs: ArtifactV3[]
  total: number
  limit: number
  pages: number
  page: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage?: number
  nextPage?: number
  error?: string
}

export type ArtifactsV3GetResponse = WebAPICallResult & {
  artifact: ArtifactV3
  error?: string
}

export type ArtifactsV3CreateResponse = WebAPICallResult & {
  artifact: ArtifactV3
  error?: string
}

export type ArtifactsV3UpdateResponse = WebAPICallResult & {
  artifact: ArtifactV3
  error?: string
}

export type ArtifactsV3PatchItemsResponse = WebAPICallResult & {
  artifact: ArtifactV3
  error?: string
}

export type ArtifactsV3DeleteResponse = WebAPICallResult & {
  message?: string
  error?: string
}

export type ArtifactsV3GetPermissionsResponse = WebAPICallResult & {
  permissions: ArtifactPermissionV3[]
  error?: string
}

export type ArtifactsV3UpdatePermissionsResponse = WebAPICallResult & {
  permissions: ArtifactPermissionV3[]
  error?: string
}

export interface ArtifactsV3HistoryResponse extends WebAPICallResult {
  docs: ArtifactEditV3[]
  total: number
  limit: number
  pages: number
  page: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage?: number
  nextPage?: number
  error?: string
}
