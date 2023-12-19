// packages/eden-sdk/src/methods/Characters.ts
import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'

import {
  ListQueryParams,
  PaginatedResponse,
  WebAPICallOptions,
  WebAPICallResult,
} from '../EdenClient'
import { transformArgsIntoURLParams } from '../methods'

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
  deleted?: boolean
  isPrivate?: boolean
  createdAt: string
  updatedAt: string
}

export type LogosData = {
  capabilities?: Capabilites[]
  identity?: string
  knowledge?: string
  knowledgeSummary?: string
  concept?: string
}

export enum Capabilites {
  CHAT = 'chat',
  CREATION = 'creation',
  KNOWLEDGE = 'knowledge',
}
