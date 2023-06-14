import { PaginatedResponse } from '.'
import { WebAPICallResult } from '../EdenClient'

export type ApiKeysCreateResponse = WebAPICallResult & {
  error?: string
  apiKey?: NewApiKey
}

export type ApiKeysDeleteResponse = WebAPICallResult & {
  error?: string
}

export type ApiKeysListResponse = WebAPICallResult &
  PaginatedResponse<ApiKey> & {
    error?: string
  }

export type ApiKey = {
  apiKey: string
  apiSecret: string
  note: string
  createdAt: string
}

export type NewApiKey = {
  apiKey: string
  apiSecret: string
}
