// packages/eden-sdk/src/methods/Characters.ts
import { transformArgsIntoURLParams } from '../types'
import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../types'
import { Creator } from './Creators'
import { AxiosRequestConfig } from 'axios'

// Arguments

export interface CharactersListArguments
  extends WebAPICallOptions,
    ListQueryParams {
  userId?: string | string[]
}

export interface CharactersGetArguments extends WebAPICallOptions {
  characterId: string
}

export interface CharactersCreateArguments extends WebAPICallOptions {
  name: string
  image?: string
  voice?: string
  greeting?: string
  dialogue?: any[]
  logosData: LogosData
  isPrivate?: boolean
}

export interface CharactersUpdateArguments extends WebAPICallOptions {
  characterId: string
  name?: string
  image?: string
  voice?: string
  greeting?: string
  dialogue?: any[]
  logosData?: LogosData
  isPrivate?: boolean
}

export interface CharactersDeleteArguments extends WebAPICallOptions {
  characterId: string
}

export interface CharactersTestArguments extends WebAPICallOptions {
  name: string
  identity: string
  message: string
  knowledge?: string
  knowledge_summary?: string
  attachments?: string[]
}

export interface CharactersInteractArguments extends WebAPICallOptions {
  sessionId: string
  characterId: string
  message: string
  attachments?: string[]
}

// Requests

export const charactersListRequestConfig = (
  args: CharactersListArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams({
    ...args,
  })
  return {
    method: 'GET',
    url: 'characters',
    params,
  }
}

export const charactersGetRequestConfig = (
  args: CharactersGetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `characters/${args.characterId}`,
  }
}

export const charactersCreateRequestConfig = (
  args: CharactersCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'characters',
    data: {
      ...args,
    },
  }
}

export const charactersUpdateRequestConfig = (
  args: CharactersUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `characters/${args.characterId}`,
    data: {
      ...args,
    },
  }
}

export const charactersDeleteRequestConfig = (
  args: CharactersDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'characters/delete',
    data: {
      ...args,
    },
  }
}

export const charactersTestRequestConfig = (
  args: CharactersTestArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'characters/test',
    data: {
      ...args,
    },
  }
}

export const charactersInteractRequestConfig = (
  args: CharactersInteractArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'characters/interact',
    data: {
      ...args,
    },
  }
}

// Responses

export type CharactersCreateResponse = WebAPICallResult & {
  error?: string
  characterId?: string
}

export type CharactersUpdateResponse = WebAPICallResult & {
  error?: string
  character?: Character
}

export type CharactersDeleteResponse = WebAPICallResult & {
  error?: string
  success?: boolean
}

export type CharactersListResponse = WebAPICallResult &
  PaginatedResponse<Character> & {
    error?: string
  }

export type CharactersGetResponse = WebAPICallResult & {
  error?: string
  character?: Character
}

export type CharactersTestResponse = WebAPICallResult & {
  error?: string
  message?: string
  config?: any
}

export type CharactersInteractResponse = WebAPICallResult & {
  error?: string
  message?: string
  config?: any
}

// Types

export type Character = {
  _id: string
  user: Creator
  name: string
  slug: string
  greeting?: string
  dialogue?: any[]
  logosData?: LogosData
  image?: string
  voice?: string
  creationCount?: number
  isPrivate?: boolean
  deleted?: boolean
  createdAt: string
  updatedAt: string
}

export type LogosData = {
  capabilities?: Capabilities[]
  identity?: string
  knowledge?: string
  knowledgeSummary?: string
  concept?: string
}

export enum Capabilities {
  CHAT = 'chat',
  CREATION = 'creation',
  KNOWLEDGE = 'knowledge',
}
