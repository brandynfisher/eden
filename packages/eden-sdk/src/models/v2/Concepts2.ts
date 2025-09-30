import {
  WebAPICallOptions,
  WebAPICallResult,
  transformArgsIntoURLParams,
} from '../../types'
import { Creator } from '../Creators'
import { AxiosRequestConfig } from 'axios'

// Types
export type ConceptImage = {
  image: string
  usage_instructions: string
}

export type Concept2 = {
  _id: string
  name: string
  user: Creator
  agent?: string
  thumbnail?: string
  deleted?: boolean
  usage_instructions?: string
  images: ConceptImage[]
  sdxl_lora?: string
  flux_lora?: string
  createdAt?: Date
  updatedAt?: Date
}

// Arguments
export interface UserConceptsGetArguments extends WebAPICallOptions {}

export interface ConceptCreateArguments extends WebAPICallOptions {
  name: string
  agent?: string
  usage_instructions?: string
  images: ConceptImage[]
}

export interface ConceptUpdateArguments extends WebAPICallOptions {
  conceptId: string
  name?: string
  agent?: string
  usage_instructions?: string
  images?: ConceptImage[]
}

export interface ConceptDeleteArguments extends WebAPICallOptions {
  conceptId: string
}

// Request Configs
export const userConceptsListRequestConfig = (
  args: UserConceptsGetArguments,
): AxiosRequestConfig => {
  const params = transformArgsIntoURLParams(args)
  return {
    method: 'GET',
    url: 'v2/concepts',
    params,
  }
}

export const conceptCreateRequestConfig = (
  args: ConceptCreateArguments,
): AxiosRequestConfig => {
  return {
    method: 'POST',
    url: 'v2/concepts',
    data: {
      name: args.name,
      agent: args.agent,
      usage_instructions: args.usage_instructions,
      images: args.images,
    },
  }
}

export const conceptUpdateRequestConfig = (
  args: ConceptUpdateArguments,
): AxiosRequestConfig => {
  return {
    method: 'PATCH',
    url: `v2/concepts/${args.conceptId}`,
    data: {
      name: args.name,
      agent: args.agent,
      usage_instructions: args.usage_instructions,
      images: args.images,
    },
  }
}

export const conceptDeleteRequestConfig = (
  args: ConceptDeleteArguments,
): AxiosRequestConfig => {
  return {
    method: 'DELETE',
    url: `v2/concepts/${args.conceptId}`,
  }
}

// Response Types
export type UserConceptsListResponse = WebAPICallResult & {
  concepts?: Concept2[]
  error?: string
}

export type ConceptCreateResponse = WebAPICallResult & {
  concept?: Concept2
  error?: string
}

export type ConceptUpdateResponse = WebAPICallResult & {
  concept?: Concept2
  error?: string
}

export type ConceptDeleteResponse = WebAPICallResult & {
  success?: boolean
  error?: string
}
