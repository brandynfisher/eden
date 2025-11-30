import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'
import { CreationV2 } from 'src/models/v2/CreationsV2'
import { WebAPICallOptions, WebAPICallResult } from 'src/types'

// Types
export type ArtifactCreation = {
  creation: CreationV2
  caption?: string
}

export type ArtifactV2 = {
  _id: string
  user: Creator
  title: string
  type: string
  parent?: {
    _id: string
    title: string
    type: string
  }
  agents?: Creator[]
  public: boolean
  description?: string
  session?: string
  creations: ArtifactCreation[]
  createdAt: Date
  updatedAt: Date
  deleted?: boolean
}

// Arguments
export interface ArtifactsV2ListArguments extends WebAPICallOptions {
  page?: number
  limit?: number
  userId?: string
  type?: string
  agentId?: string
  sessionId?: string
}

export interface ArtifactsV2GetArguments extends WebAPICallOptions {
  artifactId: string
}

export interface ArtifactsV2CreateArguments extends WebAPICallOptions {
  title: string
  type: string
  parent?: string
  agents?: string[]
  public?: boolean
  description?: string
  session?: string
  creations?: Array<{
    creation: string
    caption?: string
  }>
}

export interface ArtifactsV2UpdateArguments extends WebAPICallOptions {
  artifactId: string
  title?: string
  type?: string
  parent?: string | null
  agents?: string[]
  public?: boolean
  description?: string
  session?: string | null
  creations?: Array<{
    creation: string
    caption?: string
  }>
  deleted?: boolean
}

export interface ArtifactsV2DeleteArguments extends WebAPICallOptions {
  artifactId: string
}

export interface ArtifactsV2AddCreationArguments extends WebAPICallOptions {
  artifactId: string
  creationId: string
  caption?: string
}

export interface ArtifactsV2RemoveCreationArguments extends WebAPICallOptions {
  artifactId: string
  creationId: string
}

// Requests
export const artifactsV2ListRequestConfig = (
  args: ArtifactsV2ListArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'v2/artifacts',
    params: args,
  }
}

export const artifactsV2GetRequestConfig = (
  args: ArtifactsV2GetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/artifacts/${args.artifactId}`,
  }
}

export const artifactsV2CreateRequestConfig = (
  args: ArtifactsV2CreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/artifacts',
    data: args,
  }
}

export const artifactsV2UpdateRequestConfig = (
  args: ArtifactsV2UpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v2/artifacts/${args.artifactId}`,
    data: args,
  }
}

export const artifactsV2DeleteRequestConfig = (
  args: ArtifactsV2DeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/artifacts/${args.artifactId}`,
  }
}

export const artifactsV2AddCreationRequestConfig = (
  args: ArtifactsV2AddCreationArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: `v2/artifacts/${args.artifactId}/creations`,
    data: {
      creationId: args.creationId,
      caption: args.caption,
    },
  }
}

export const artifactsV2RemoveCreationRequestConfig = (
  args: ArtifactsV2RemoveCreationArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/artifacts/${args.artifactId}/creations/${args.creationId}`,
  }
}

// Responses
export interface ArtifactsV2ListResponse extends WebAPICallResult {
  docs: ArtifactV2[]
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

export type ArtifactsV2GetResponse = WebAPICallResult & {
  artifact: ArtifactV2
  error?: string
}

export type ArtifactsV2CreateResponse = WebAPICallResult & {
  artifact: ArtifactV2
  error?: string
}

export type ArtifactsV2UpdateResponse = WebAPICallResult & {
  artifact: ArtifactV2
  error?: string
}

export type ArtifactsV2DeleteResponse = WebAPICallResult & {
  message?: string
  error?: string
}

export type ArtifactsV2AddCreationResponse = WebAPICallResult & {
  artifact: ArtifactV2
  error?: string
}

export type ArtifactsV2RemoveCreationResponse = WebAPICallResult & {
  message?: string
  error?: string
}
