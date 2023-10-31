import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'
import { Task } from 'src/models/Tasks'

import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../EdenClient'
import { transformArgsIntoURLParams } from '../methods'

// Arguments

export interface CreationsListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
  taskId?: string
}

export interface CreationsGetArguments extends WebAPICallOptions {
  creationId: string
}

export interface CreationsGetSimilarArguments extends WebAPICallOptions {
  creationId: string
  n: number
}

export interface CreationsReactArguments extends WebAPICallOptions {
  creationId: string
  reaction: ReactionType
}

export interface CreationsUnreactArguments extends WebAPICallOptions {
  creationId: string
  reaction: ReactionType
}

export interface CreationsDeleteArguments extends WebAPICallOptions {
  creationId: string
}

export interface CreationsUpdateArguments extends WebAPICallOptions {
  creationId: string
  isPrivate: boolean
}

// Requests

export const creationsListRequestConfig = (
  args: CreationsListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'creations',
    params,
  }
}

export const creationsGetRequestConfig = (
  args: CreationsGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `creations/${args.creationId}`,
  }
}

export const creationsGetSimilarRequestConfig = (
  args: CreationsGetSimilarArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `creations/${args.creationId}/similar`,
  }
}

export const creationsReactRequestConfig = (
  args: CreationsReactArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'creations/react',
    data: {
      ...args,
    },
  }
}

export const creationsUnreactRequestConfig = (
  args: CreationsUnreactArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'creations/unreact',
    data: {
      ...args,
    },
  }
}

export const creationsUpdateRequestConfig = (
  args: CreationsUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `creations/${args.creationId}`,
    data: {
      ...args,
    },
  }
}

export const creationsDeleteRequestConfig = (
  args: CreationsDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `creations/${args.creationId}`,
    data: {
      ...args,
    },
  }
}

// Responses

export type CreationsListResponse = WebAPICallResult &
  PaginatedResponse<Creation> & {
    error?: string
  }

export type CreationsGetResponse = WebAPICallResult & {
  error?: string
  creation?: Creation
}

export type CreationsGetSimilarResponse = WebAPICallResult & {
  error?: string
  similarCreations?: Creation[]
}

export type CreationsReactResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type CreationsUnreactResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type CreationsUpdateResponse = WebAPICallResult & {
  error?: string
  creation?: Creation
}

export type CreationsDeleteResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

// Types

export type Reactions = Record<string, boolean>

export type Creation = {
  _id: string
  user: Creator
  userId?: string
  task: Task
  samples?: string[]
  parent?: string
  delegateUser?: string
  delegateHasClaimed?: boolean
  uri: string
  thumbnail?: string
  name: string
  attributes: any
  mediaAttributes: MediaAttributes
  praiseCount?: number
  bookmarkCount?: number
  bookmarked?: boolean
  reactions?: Reactions
  deleted?: boolean
  isPrivate?: boolean
  createdAt: string
  updatedAt: string
}

export interface MediaAttributes {
  type: MediaType
  duration?: number
  width?: number
  height?: number
  aspectRatio?: number
}

export enum ReactionType {
  Praise = 'praise',
}

export enum MediaType {
  Image = 'image',
  Video = 'video',
  Text = 'text',
  Audio = 'audio',
  Zip = 'zip',
  Unknown = 'unknown',
}
