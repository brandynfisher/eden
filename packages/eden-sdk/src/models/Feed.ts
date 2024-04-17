import { ListCursorQueryParams, transformArgsIntoURLParams } from '../types'
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

interface FeedCreationsBaseArguments extends WebAPICallOptions {
  userId?: string | string[]
  creationId?: string
  characterId?: string | string[]
  collectionId?: string | string[]
  conceptId?: string | string[]
  generatorId?: string | string[]
  outputType?: string | string[]
  isPrivate?: string
  name?: string
  maxDate?: string
  minDate?: string
  orderBy?: string
  direction?: 1 | -1
}

interface FeedConceptsBaseArguments extends WebAPICallOptions {
  userId?: string | string[]
  collectionId?: string | string[]
  name?: string
  maxDate?: string
  minDate?: string
  orderBy?: string
  direction?: 1 | -1
  creationId?: string
  characterId?: string | string[]
  isPrivate?: string
}

interface FeedCreatorsBaseArguments extends WebAPICallOptions {
  userId?: string | string[]
  name?: string
  maxDate?: string
  minDate?: string
  orderBy?: string
}

export interface FeedCreationsArguments
  extends FeedCreationsBaseArguments,
    ListQueryParams {}

export interface FeedCreationsCursorArguments
  extends FeedCreationsBaseArguments,
    ListCursorQueryParams {}

export interface FeedConceptsCursorArguments
  extends FeedConceptsBaseArguments,
    ListCursorQueryParams {}

export interface FeedCreatorsCursorArguments
  extends FeedCreatorsBaseArguments,
    ListCursorQueryParams {}

export interface FeedConceptsArguments
  extends FeedConceptsBaseArguments,
    ListQueryParams {}

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

export const feedCursorCreationsRequestConfig = (
  args: FeedCreationsArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'feed-cursor/creations',
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

export const feedCursorConceptsRequestConfig = (
  args: FeedCreationsArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'feed-cursor/concepts',
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
