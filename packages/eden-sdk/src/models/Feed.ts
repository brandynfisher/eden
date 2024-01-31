import { transformArgsIntoURLParams } from '../types'
import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../types'
import { Concept } from './Concepts'
import { Creation } from './Creations'
import { AxiosRequestConfig } from 'axios'

// Arguments

export interface FeedCreationsArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
  creationId?: string
  characterId?: string | string[]
  collectionId?: string | string[]
  conceptId?: string | string[]
  generatorId?: string | string[]
  name?: string
  maxDate?: string
  minDate?: string
  orderBy?: string
  direction?: 1 | -1
}

export interface FeedConceptsArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
  collectionId?: string | string[]
  name?: string
  maxDate?: string
  minDate?: string
  orderBy?: string
  direction?: 1 | -1
}

export interface FeedCharactersArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
  name?: string
}

export interface FeedCreatorsArguments
  extends WebAPICallOptions,
    ListQueryParams {
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
