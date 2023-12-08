import { AxiosRequestConfig } from 'axios'

import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../EdenClient'
import { transformArgsIntoURLParams } from '../methods'
import { Concept } from './Concepts'
import { Creation } from './Creations'

// Arguments

export interface FeedCreationsArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
  characterId?: string | string[]
  collectionId?: string | string[]
  conceptId?: string | string[]
  name?: string
}

export interface FeedConceptsArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
  collectionId?: string | string[]
  name?: string
}

// Requests

export const feedCreationsRequestConfig = (
  args: FeedCreationsArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'feed/creations',
    params,
  }
}

export const feedConceptsRequestConfig = (
  args: FeedConceptsArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'feed/concepts',
    params,
  }
}

// Responses

export type FeedCreationsResponse = WebAPICallResult &
  PaginatedResponse<Creation> & {
    error?: string
    reactions?: {
      [creationId: string]: {
        [reaction: string]: number
      }
    }
    bookmarks?: {
      [creationId: string]: boolean
    }
  }

export type FeedConceptsResponse = WebAPICallResult &
  PaginatedResponse<Concept> & {
    error?: string
    reactions?: {
      [conceptId: string]: {
        [reaction: string]: number
      }
    }
    bookmarks?: {
      [conceptId: string]: boolean
    }
  }
