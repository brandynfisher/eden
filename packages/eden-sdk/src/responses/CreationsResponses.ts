import { PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'

export type CreationsListResponse = WebAPICallResult &
  PaginatedResponse<Creation> & {
    error?: string
  }

export type CreationsGetResponse = WebAPICallResult & {
  error?: string
  creation?: Creation
}

export type CreationsReactResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type CreationsUnreactResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type Reactions = Record<string, boolean>

export type Creation = {
  _id: string
  user: string
  task: string
  parent?: string
  delegateUser?: string
  delegateHasClaimed?: boolean
  uri: string
  thumbnail?: string
  name: string
  attributes: any
  mediaAttributes: MediaAttributes
  bookmarked?: boolean
  reactions?: Reactions
}

export interface MediaAttributes {
  type: MediaType
  duration?: number
}

export enum ReactionType {
  Praise = 'praise',
  Burn = 'burn',
}

export enum MediaType {
  Image = 'image',
  Video = 'video',
  Text = 'text',
  Audio = 'audio',
}
