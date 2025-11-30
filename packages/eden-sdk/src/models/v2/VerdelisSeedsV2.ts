import { AxiosRequestConfig } from 'axios'
import { Creator } from 'src/models/Creators'
import { WebAPICallOptions, WebAPICallResult } from 'src/types'

// Types
export type VerdelisSeedV2 = {
  _id: string
  title: string
  logline: string
  images: string[]
  agents?: Creator[]
  createdAt: Date
  updatedAt: Date
  deleted?: boolean
}

// Arguments
export interface VerdelisSeedsV2ListArguments extends WebAPICallOptions {
  page?: number
  limit?: number
  agentId?: string
}

export interface VerdelisSeedsV2GetArguments extends WebAPICallOptions {
  seedId: string
}

// Requests
export const verdelisSeedsV2ListRequestConfig = (
  args: VerdelisSeedsV2ListArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: 'v2/verdelis-seeds',
    params: args,
  }
}

export const verdelisSeedsV2GetRequestConfig = (
  args: VerdelisSeedsV2GetArguments,
): AxiosRequestConfig => {
  return {
    method: 'GET',
    url: `v2/verdelis-seeds/${args.seedId}`,
  }
}

// Responses
export interface VerdelisSeedsV2ListResponse extends WebAPICallResult {
  docs: VerdelisSeedV2[]
  total: number
  limit: number
  pages: number
  page: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage?: number
  nextPage?: number
  error?: string
}

export type VerdelisSeedsV2GetResponse = WebAPICallResult & {
  seed: VerdelisSeedV2
  error?: string
}
