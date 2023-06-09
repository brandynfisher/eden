import { WebAPICallResult } from '../EdenClient'
import { PaginatedResponse } from './base'

export type ApiKeysGetResponse = WebAPICallResult &
  PaginatedResponse<ApiKey> & {
    error?: string
  }

export type ApiKey = {
  apiKey: string
  apiSecret: string
  note: string
  createdAt: string
}
