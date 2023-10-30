import { Creator, PaginatedResponse, Task } from '.'
import { WebAPICallResult } from '../EdenClient'

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
