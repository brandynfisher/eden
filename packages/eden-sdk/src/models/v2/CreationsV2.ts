import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { Creator } from '../Creators'
import { MediaAttributes } from '../Media'
import { AxiosRequestConfig } from 'axios'

// Arguments

export interface CreationsV2ListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
  name?: string
}

export interface CreationsV2GetArguments extends WebAPICallOptions {
  creationId: string
}

export interface CreationsV2RatingArguments extends WebAPICallOptions {
  creationId: string
  rating: number
}

export interface CreationsV2ReactArguments extends WebAPICallOptions {
  creationId: string
  reaction: ReactionType
}

export interface CreationsV2UnreactArguments extends WebAPICallOptions {
  creationId: string
  reaction: ReactionType
}

export interface CreationsV2DeleteArguments extends WebAPICallOptions {
  creationId: string
}

export interface CreationsV2UpdateArguments extends WebAPICallOptions {
  creationId: string
  isPrivate: boolean
}

// Requests

export const creationsListRequestConfig = (
  args: CreationsV2ListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/creations',
    params,
  }
}

export const creationsGetRequestConfig = (
  args: CreationsV2GetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/creations/${args.creationId}`,
  }
}

export const creationsReactRequestConfig = (
  args: CreationsV2ReactArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/creations/reactions/add',
    data: {
      ...args,
    },
  }
}

export const creationsUnreactRequestConfig = (
  args: CreationsV2UnreactArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/creations/reactions/remove',
    data: {
      ...args,
    },
  }
}

export const creationsUpdateRequestConfig = (
  args: CreationsV2UpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v2/creations/${args.creationId}`,
    data: {
      ...args,
    },
  }
}

export const creationsDeleteRequestConfig = (
  args: CreationsV2DeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/creations/${args.creationId}`,
    data: {
      ...args,
    },
  }
}

// Responses

export type CreationsV2ListResponse = WebAPICallResult &
  PaginatedResponse<CreationV2> & {
    error?: string
  }

export type CreationsV2GetResponse = WebAPICallResult & {
  error?: string
  message?: string
  creation?: CreationV2
}

export type CreationsV2ReactResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type CreationsV2UnreactResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type CreationsV2UpdateResponse = WebAPICallResult & {
  error?: string
  creation?: CreationV2
}

export type CreationsV2DeleteResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

// Types

export type Reactions = Record<string, boolean>

export type CreationV2 = {
  _id: string
  user: Creator
  character?: string
  userId?: string
  task: string
  samples?: string[]
  parent?: string
  delegateUser?: string
  delegateHasClaimed?: boolean
  uri: string
  mediaUri?: string
  thumbnail?: string
  name: string
  attributes: CreationV2Attributes
  mediaAttributes: MediaAttributes
  creationCount?: number
  praiseCount?: number
  bookmarkCount?: number
  bookmarked?: boolean
  reactions?: Reactions
  deleted?: boolean
  isPrivate?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreationV2Attributes {
  nsfw_score?: number
  interrogation?: string
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
